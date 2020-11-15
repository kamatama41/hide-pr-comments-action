const https = require('https');
const core = require('@actions/core');
const github = require('@actions/github');
const HOST = 'api.github.com';
const PATH = '/graphql';

function gqlRequest(query) {
  return new Promise(((resolve, reject) => {
    const githubToken = core.getInput('github_token') || process.env.GITHUB_TOKEN
    const options = {
      host: HOST,
      port: 443,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${githubToken}`,
        'User-Agent': 'delete-previous-comments.js',
      }
    }
    let req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      }).on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(body))
        } else {
          const res = JSON.parse(body)
          if (res.errors) {
            reject(new Error(body))
          } else {
            resolve(res)
          }
        }
      });
    }).on('error', (e) => {
      reject('problem with request: ' + e.message);
    });
    req.write(JSON.stringify({query: query}));
    req.end();
  }));
}

async function getUnhiddenComments(owner, name, prNumber) {
  let result = []
  let pageInfo
  do {
    const after = pageInfo && pageInfo.hasNextPage ? `, after: "${pageInfo.endCursor}"` : ''
    const query = `
      query {
        repository (owner: "${owner}" name: "${name}") {
          pullRequest(number: ${prNumber}) {
            comments (first: 100 ${after}) {
              pageInfo { hasNextPage, endCursor }
              nodes {
                id
                isMinimized,
                author { login }
                body
              }
            }
          }
        }
      }
    `.trim()
    const res = await gqlRequest(query)
    pageInfo = res.data.repository.pullRequest.comments.pageInfo
    result.push(...res.data.repository.pullRequest.comments.nodes.filter(comment => !comment.isMinimized))
  } while (pageInfo.hasNextPage)

  return result
}

async function hideComments(comments) {
  for (let comment of comments) {
    console.log(`Hide comment ${comment.id}`)
    const query = `
      mutation { 
        minimizeComment(input: {classifier:OUTDATED, subjectId: "${comment.id}"}) {
          clientMutationId
        }
      }
    `.trim()
    await gqlRequest(query)
  }
}

function filterComments(comments, condition) {
  return comments.filter(comment => {
    const author = condition.author
    if (author && comment.author.login !== author) {
      return false
    }
    const messageRegex = condition.messageRegex
    if (messageRegex && !comment.body.match(messageRegex)) {
      return false
    }
    return true
  })
}


async function main() {
  core.debug(`The context info: ${JSON.stringify(github.context, undefined, 2)}`);
  if (github.context.eventName !== 'pull_request') {
    throw new Error(`Unsupported event: ${github.context.eventName}`)
  }
  const prNumber = github.context.payload['number'];
  core.info(`Delete unhidden comments of #${prNumber}`)
  const repo = github.context.payload.repository
  const owner = repo.owner.login
  const name = repo.name

  let comments = await getUnhiddenComments(owner, name, prNumber)
  const condition = {
    author: core.getInput('author'),
    messageRegex: core.getInput('message_regex'),
  }
  comments = filterComments(comments, condition)
  if (comments.length === 0) {
    core.info('No unhidden comments found')
    return
  }
  return hideComments(filterComments(comments, condition))
}


main().catch(error => core.setFailed(error.message));

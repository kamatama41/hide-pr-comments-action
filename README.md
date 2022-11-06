# hide-pr-comments-action

A GitHub action to hide PR comments by given condition

## Example

```yaml
# This action is available only on pull_request event
on: pull_request

jobs:
  hide-pr-comments-action:
    runs-on: ubuntu-latest
    steps:
    - name: Hide PR comments
      id: action
      uses: kamatama41/hide-pr-comments-action@v0
      with:
        author: my-system-bot                 # OPTIONAL filter comments by the author
        message_regex: "Test result: (OK|NG)" # OPTIONAL filter comments by the regexp
        pr_number: 1                          # OPTIONAL use this option to apply to specific pull request
```

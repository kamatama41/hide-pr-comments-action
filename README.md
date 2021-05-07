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
        author: my-system-bot                 # OPTIONAL
        message_regex: "Test result: (OK|NG)" # OPTIONAL
```

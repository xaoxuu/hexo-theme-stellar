#!/bin/bash
#
# https://xaoxuu.com/wiki/stellar
#
# 只有 rc 阶段的测试版本和正式版本发布到 npm
#
# 1. 输入要发布的版本号
# 2. 修改主题 _config.yml 中的 stellar.version
# 3. 修改主题 package.json 中的 version
# 4. 提交 commit

# 版本号 例如 1.0.0-rc.1
VERSION=$1

# 替换版本号
function prepare() {
  text="'"${VERSION}"'"
  sed -i "" "s/^  version:\([^\"]\{1,\}\)/  version: ${text}/g" '_config.yml'
  sed -i "" "s/^  \"version\":\([^,]\{1,\}\)/  \"version\": \"${VERSION}\"/g" 'package.json'
  main=${VERSION%%.*}
  sub=${VERSION#*.}
  sub=${sub%%.*}
  jsdelivr=$main'.'$sub
  sed -i "" "s/\(gcore.jsdelivr.net\/npm\/hexo-theme-stellar@[^/]\{1,\}\)/gcore.jsdelivr.net\/npm\/hexo-theme-stellar@${jsdelivr}/g" '_config.yml'
}

# 提交
function commit() {
  msg="release: ${VERSION}"

  printf "\n\n> \033[32m%s\033[0m" 'git add --all'
  printf "\n"
  git add --all

  printf "\n\n> \033[32m%s\033[0m" 'git commit -m'
  printf " \033[35m%s\033[0m" ${msg}
  printf "\n"
  git commit -m "${msg}"

  git checkout npm
  git rebase main

  printf "\n\n> \033[32m%s\033[0m" 'git push origin'
  # printf "\n"
  git push origin main
  git push origin npm

  # npm publish

  # git tag ${VERSION}
  # git push --tags

  git checkout main
  # done
  printf "\n\n> \033[32m%s\033[0m\n" 'Congratulations!'
}


while :
do
  case $VERSION in
    '')
      read -p "请输入要发布的版本号: " VERSION
    ;;
    *)
    break
    ;;
  esac
done

prepare && commit

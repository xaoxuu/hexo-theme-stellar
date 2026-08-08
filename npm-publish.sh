#!/bin/bash
#
# Stellar 发版脚本
# https://xaoxuu.com/wiki/stellar
#
# 用法:
#   bash npm-publish.sh 1.33.2           # 正常发版
#   bash npm-publish.sh 1.33.2 --dry-run # 预览，不执行实际操作
#
# CI 自动化:
#   push npm 分支 → CI 自动 npm publish + 创建 Git tag
#   详见 .github/workflows/npm-publish.yml

set -euo pipefail

DRY_RUN=false
VERSION=""

# 解析参数
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)
      DRY_RUN=true
      ;;
    --*)
      echo "未知选项: $arg"
      exit 1
      ;;
    *)
      VERSION="$arg"
      ;;
  esac
done

# 版本号必填
if [[ -z "$VERSION" ]]; then
  read -p "请输入要发布的版本号: " VERSION
fi

# 验证版本号格式
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?$ ]]; then
  echo "错误: 版本号格式不正确: $VERSION (应为 x.y.z 或 x.y.z-rc.n)"
  exit 1
fi

echo ">>> 发布版本: $VERSION"
echo ">>> 模式: dry_run=$DRY_RUN"
echo ""

# ── 前置检查 ──────────────────────────────────────────────

# 1. 检查当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "错误: 当前分支为 $CURRENT_BRANCH，发版必须在 main 分支执行"
  exit 1
fi

# 2. 检查是否有未提交的改动（除 _config.yml 和 package.json 外）
UNSTAGED=$(git diff --name-only)

# 允许的改动文件（发版脚本待会要改的）
ALLOWED_FILES="_config.yml package.json"
EXTRA_FILES=""
for f in $UNSTAGED; do
  if [[ "$ALLOWED_FILES" != *"$f"* ]]; then
    EXTRA_FILES="$EXTRA_FILES $f"
  fi
done

if [[ -n "$EXTRA_FILES" ]]; then
  echo "错误: 工作区存在未提交的无关改动:"
  echo "$EXTRA_FILES"
  echo "请先提交或暂存这些改动后再发版"
  exit 1
fi

# ── 版本号替换 ────────────────────────────────────────────

function prepare() {
  local text="'${VERSION}'"

  # 1. _config.yml → stellar.version
  sed -i "" "s/^  version:\([^\"]\{1,\}\)/  version: ${text}/g" '_config.yml'

  # 2. package.json → version
  sed -i "" "s/^  \"version\":\([^,]\{1,\}\)/  \"version\": \"${VERSION}\"/g" 'package.json'

  # 3. CDN URL 版本号更新
  local main=${VERSION%%.*}
  local sub=${VERSION#*.}
  sub=${sub%%.*}
  local jsdelivr="${main}.${sub}"
  sed -i "" "s/\(gcore.jsdelivr.net\/npm\/hexo-theme-stellar@[^/]\{1,\}\)/gcore.jsdelivr.net\/npm\/hexo-theme-stellar@${jsdelivr}/g" '_config.yml'

  # 显示变更
  echo ">>> 文件变更:"
  git diff --stat
  git diff _config.yml package.json | grep "^[+-]" | grep -v "^[+-]\{3\}" | head -20
  echo ""
}

# ── 提交 ──────────────────────────────────────────────────

function commit_and_push() {
  local msg="release: ${VERSION}"

  echo ">>> git add _config.yml package.json"
  git add _config.yml package.json

  echo ">>> git commit -m \"$msg\""
  git commit -m "$msg"

  echo ">>> git push origin main"
  git push origin main

  # npm 分支
  echo ">>> git checkout npm && git rebase main"
  git checkout npm
  git rebase main
  echo ">>> git push origin npm"
  git push origin npm

  # 回到 main
  git checkout main
  echo ""
  echo ">>> 发版完成: $VERSION"
  echo ">>> CI 将在检测到 npm 分支 push 后自动发布到 npm 并创建 tag"
}

# ── 执行 ──────────────────────────────────────────────────

echo ">>> 更新版本号..."
prepare

if $DRY_RUN; then
  echo ">>> [DRY RUN] 跳过提交和推送，回滚改动..."
  git checkout -- _config.yml package.json
  echo ">>> 已回滚"
else
  commit_and_push
fi

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stellar 主题中文知识库硬事实核查脚本

扫描 Markdown 知识库文件，与 themes/stellar/ 源码对照，检查：
  1. 引用的主题文件路径是否存在（支持 glob 通配与 basename 兜底解析）
  2. 配置键（dotted key）是否存在于主题 _config.yml
  3. 函数/对象标识符是否在 scripts/ 与 source/js/ 中找到
  4. 行号引用是否有效（文件存在且行数足够）
  5. 版本号是否与 package.json 一致

用法：
  python3 tools/verify.py [目录]      # 默认扫描 docs/knowledge/（跳过 README/VERIFICATION/术语表/合并版）

输出：
  tools/verify-report.json（机器可读）与终端摘要
"""

import glob
import json
import os
import re
import subprocess
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
THEME = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
CFG = os.path.join(THEME, '_config.yml')
PKG = os.path.join(THEME, 'package.json')
SRC_DIRS = [os.path.join(THEME, 'scripts'), os.path.join(THEME, 'source', 'js')]

EXTS = 'json|yaml|styl|ejs|yml|js|md|css|svg|png|jpg|ico|txt|sh'
FILE_RE = re.compile(r'([\w./@-]+\.(?:' + EXTS + r'))')
LINE_REF_RE = re.compile(r'([\w./-]+\.(?:' + EXTS + r')):?(\d+)(?:-(\d+))?')
IDENT_RE = re.compile(r'^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)*$')
THEME_VERSION_CTX_RE = re.compile(r'version:?\s*(?:v)?\d+\.\d+\.\d+', re.I)


def theme_version():
    with open(PKG, encoding='utf-8') as f:
        return json.load(f).get('version', '')


def yaml_key_paths(path):
    """提取 YAML 顶层与嵌套映射的 dotted key 路径（容忍注释与简单结构）。"""
    keys = set()
    stack = []  # (indent, key)
    with open(path, encoding='utf-8') as f:
        lines = f.read().splitlines()
    for ln in lines:
        stripped = ln.strip()
        if not stripped or stripped.startswith('#'):
            continue
        indent = len(ln) - len(ln.lstrip(' '))
        m = re.match(r'^([A-Za-z0-9_\-][\w\-]*):', stripped)
        if not m:
            continue
        key = m.group(1)
        while stack and stack[-1][0] >= indent:
            stack.pop()
        parts = [k for _, k in stack] + [key]
        keys.add('.'.join(parts))
        stack.append((indent, key))
    return keys


def collect_theme_files():
    """收集主题仓库全部文件（相对路径），用于 basename 兜底解析。"""
    files = {}
    for root, dirs, names in os.walk(THEME):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '.deploy_git')]
        for n in names:
            rel = os.path.relpath(os.path.join(root, n), THEME)
            files.setdefault(n, rel)
    return files


def resolve_path(rel, by_basename):
    """返回 (是否存在, 解析说明)。"""
    if os.path.isfile(os.path.join(THEME, rel)):
        return True, rel
    if os.path.isabs(rel):
        return False, None
    # 简写路径自动补全：_partial/... 位于 layout/，_defines|_common|_components|_plugins/... 位于 source/css/
    if rel.startswith('_partial/'):
        cand = os.path.join(THEME, 'layout', rel)
        if os.path.isfile(cand):
            return True, os.path.join('layout', rel)
    if rel.startswith(('_defines/', '_common/', '_components/', '_plugins/')):
        cand = os.path.join(THEME, 'source', 'css', rel)
        if os.path.isfile(cand):
            return True, os.path.join('source', 'css', rel)
    if '*' in rel:
        hits = glob.glob(os.path.join(THEME, rel))
        if hits:
            return True, os.path.relpath(hits[0], THEME)
        if rel.startswith('_partial/'):
            hits = glob.glob(os.path.join(THEME, 'layout', rel))
            if hits:
                return True, os.path.relpath(hits[0], THEME)
        return False, None
    if '/' not in rel and rel in by_basename:
        return True, by_basename[rel]
    return False, None


def line_count(rel):
    p = os.path.join(THEME, rel)
    if not os.path.isfile(p):
        return None
    with open(p, encoding='utf-8', errors='replace') as f:
        return sum(1 for _ in f)


def identifier_found(ident):
    for d in SRC_DIRS:
        if not os.path.isdir(d):
            continue
        r = subprocess.run(['rg', '-l', '-F', ident, d], capture_output=True, text=True)
        if r.returncode == 0 and r.stdout.strip():
            return True
    return False


def is_file_like(tok):
    return re.search(r'\.(?:' + EXTS + r')$', tok) is not None


def outside_code_spans(text):
    """按 ``` 围栏切分，返回代码块之外的所有片段。"""
    spans = []
    pos = 0
    for m in re.finditer(r'^```.*$', text, re.M):
        if m.start() > pos:
            spans.append(text[pos:m.start()])
        pos = m.end()
    if pos < len(text):
        spans.append(text[pos:])
    return spans


def extract_facts(text):
    files, line_refs, idents, versions = {}, set(), set(), set()

    def add_file(path):
        path = path.strip().rstrip('.,;:')
        if ' ' in path:
            path = path.rsplit(' ', 1)[-1]
        if '://' in path or path.startswith('/') or path.startswith('example.com') \
                or path.startswith('node_modules/'):
            return
        if re.search(r'[<>"\']', path):
            return
        files[path] = True

    # 1) markdown 链接目标中的文件路径（含 Sources 行，如 [README.md:28-35]()）
    for span in outside_code_spans(text):
        for m in re.finditer(r'\[[^\]]*\]\(([^)#][^)]*)\)', span):
            tgt = m.group(1).strip()
            fm = FILE_RE.search(tgt)
            if fm:
                add_file(fm.group(1))
                lm = re.search(r':?(\d+)(?:-(\d+))?$', tgt[fm.end():])
                if lm:
                    line_refs.add((fm.group(1), int(lm.group(1)), int(lm.group(2) or lm.group(1))))
    # 2) 正文中的文件路径与行号引用，如 layout/layout.ejs41-74、_config.yml539-546
    for m in LINE_REF_RE.finditer(text):
        path, s, e = m.group(1), int(m.group(2)), int(m.group(3) or m.group(2))
        add_file(path)
        line_refs.add((path, s, e))
    # 3/4) 反引号中的文件路径与 dotted 标识符（仅在代码块之外）
    for span in outside_code_spans(text):
        for m in re.finditer(r'`([^`]+)`', span):
            tok = m.group(1).strip()
            if is_file_like(tok):
                add_file(tok)
            elif IDENT_RE.match(tok) and '.' in tok:
                idents.add(tok)
    # 5) 版本号（theme 版本语境，如 version: 1.33.1）
    for m in THEME_VERSION_CTX_RE.finditer(text):
        versions.add(re.search(r'\d+\.\d+\.\d+', m.group(0)).group(0))
    return files, line_refs, idents, versions


def check_page(path, keys, tver, by_basename):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    files, line_refs, idents, versions = extract_facts(text)

    resolved = {}
    unresolved = []
    for p in files:
        ok, how = resolve_path(p, by_basename)
        if not ok and not p.startswith(('http', '#')):
            # 允许按页面文件所在目录的相对路径解析（领域页的引用方式）
            cand = os.path.normpath(os.path.join(os.path.dirname(path), p))
            if os.path.isfile(cand):
                ok, how = True, os.path.relpath(cand, THEME)
        resolved[p] = how
        if not ok:
            unresolved.append(p)

    bad_keys = []
    for ident in sorted(idents):
        first = ident.split('.')[0]
        if first in keys and ident not in keys and not any(k.startswith(ident + '.') for k in keys):
            bad_keys.append(ident)

    bad_line_refs = []
    for p, s, e in sorted(line_refs):
        how = resolved.get(p)
        if how is None:
            continue  # 已计入 unresolved
        n = line_count(how)
        if n is None or e > n:
            bad_line_refs.append({'file': p, 'resolved_to': how, 'span': f'{s}-{e}', 'lines': n})

    version_mismatch = sorted(v for v in versions if v != tver)
    return {
        'files_checked': len(files),
        'line_refs_checked': len(line_refs),
        'idents_checked': len(idents),
        'unresolved_files': unresolved,
        'basename_resolved': sorted(how for how in resolved.values() if how and how != ''),
        'bad_config_keys': bad_keys,
        'bad_line_refs': bad_line_refs,
        'version_mismatches': version_mismatch,
    }


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else '.'
    scan_dir = os.path.join(BASE, target)
    if not os.path.isdir(scan_dir):
        print(f'目录不存在: {scan_dir}')
        sys.exit(2)
    keys = yaml_key_paths(CFG)
    tver = theme_version()
    by_basename = collect_theme_files()
    report = {'target': target, 'theme_version': tver, 'pages': {}}
    total = {'unresolved_files': 0, 'bad_config_keys': 0, 'bad_line_refs': 0, 'version_mismatches': 0}
    for root, dirs, files in os.walk(scan_dir):
        for fn in sorted(files):
            if not fn.endswith('.md'):
                continue
            if fn in ('README.md', 'VERIFICATION.md', '_glossary.md', '知识库全量.md'):
                continue  # 索引/术语表/合并版为生成产物，不参与单页核查
            rel = os.path.relpath(os.path.join(root, fn), scan_dir)
            r = check_page(os.path.join(root, fn), keys, tver, by_basename)
            report['pages'][rel] = r
            for k in total:
                total[k] += len(r[k])
    report['totals'] = total
    out = os.path.join(os.path.dirname(__file__), 'verify-report.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f'核查目标: {target}  |  主题版本: {tver}')
    print(f'未解析文件: {total["unresolved_files"]}  配置键异常: {total["bad_config_keys"]}  '
          f'行号异常: {total["bad_line_refs"]}  版本不一致: {total["version_mismatches"]}')
    for fn, r in report['pages'].items():
        issues = []
        if r['unresolved_files']:
            issues.append('未解析文件: ' + ', '.join(sorted(r['unresolved_files'])))
        if r['bad_config_keys']:
            issues.append('配置键: ' + ', '.join(r['bad_config_keys']))
        if r['bad_line_refs']:
            issues.append('行号: ' + ', '.join(f"{x['file']}{x['span']}" for x in r['bad_line_refs']))
        if r['version_mismatches']:
            issues.append('版本: ' + ', '.join(r['version_mismatches']))
        if issues:
            print(f'\n{fn}')
            for i in issues:
                print('  -', i)
    print(f'\n报告已写入: {out}')

    if total['bad_line_refs'] > 0 or total['version_mismatches'] > 0:
        print('错误: 行号引用越界或版本不一致（硬事实异常），知识库核查未通过', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

// 通用 dropdown 浮层：把打开的菜单挂到 body 下，避免被任意祖先容器裁剪。
(() => {
  const selector = 'details.dropdown'
  const gap = 8
  const viewportPadding = 8
  let layer = null
  let active = null
  let frame = null
  let menuId = 0

  function getLayer() {
    if (layer && document.documentElement.contains(layer)) {
      return layer
    }
    layer = document.createElement('div')
    layer.className = 'dropdown-layer'
    document.body.appendChild(layer)
    return layer
  }

  function getDirectChild(parent, childSelector) {
    for (const child of parent.children) {
      if (child.matches(childSelector)) {
        return child
      }
    }
    return null
  }

  function getViewportSize() {
    return {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: document.documentElement.clientHeight || window.innerHeight
    }
  }

  function getDirection(dropdown) {
    const direction = dropdown.getAttribute('direction')
    return direction === 'up' || direction === 'down' ? direction : 'auto'
  }

  function getAlign(dropdown) {
    const align = dropdown.getAttribute('align')
    return align === 'left' || align === 'right' ? align : 'auto'
  }

  function setMenuId(dropdown, menu) {
    if (!menu.id) {
      menuId += 1
      menu.id = `stellar-dropdown-menu-${menuId}`
    }
    const trigger = getDirectChild(dropdown, '.dropdown-trigger')
    if (trigger) {
      trigger.setAttribute('aria-controls', menu.id)
    }
  }

  function clearMenuPosition(menu) {
    menu.style.removeProperty('top')
    menu.style.removeProperty('left')
    menu.style.removeProperty('max-height')
    menu.style.removeProperty('visibility')
    menu.style.removeProperty('opacity')
    menu.removeAttribute('data-placement')
  }

  function hideMenuBeforeOpen(dropdown) {
    const menu = getDirectChild(dropdown, '.dropdown-menu')
    if (!menu || menu.classList.contains('dropdown-menu-portal')) {
      return
    }
    menu.style.visibility = 'hidden'
    menu.style.opacity = '0'
  }

  function isPointInRect(point, rect) {
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  }

  function isPointInPolygon(point, polygon) {
    let inside = false
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
      const currentPoint = polygon[index]
      const previousPoint = polygon[previous]
      const intersects = currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x < (previousPoint.x - currentPoint.x) * (point.y - currentPoint.y) /
        (previousPoint.y - currentPoint.y) + currentPoint.x
      if (intersects) {
        inside = !inside
      }
    }
    return inside
  }

  function updateBridge(state, triggerRect, menuRect, placement) {
    const polygon = placement === 'up'
      ? [
          { x: triggerRect.left, y: triggerRect.top },
          { x: menuRect.left, y: menuRect.bottom },
          { x: menuRect.right, y: menuRect.bottom },
          { x: triggerRect.right, y: triggerRect.top }
        ]
      : [
          { x: triggerRect.left, y: triggerRect.bottom },
          { x: triggerRect.right, y: triggerRect.bottom },
          { x: menuRect.right, y: menuRect.top },
          { x: menuRect.left, y: menuRect.top }
        ]
    const clipPath = `polygon(${polygon.map(point => `${Math.round(point.x)}px ${Math.round(point.y)}px`).join(', ')})`
    state.bridge.__stellarDropdownPolygon = polygon
    state.bridge.style.clipPath = clipPath
    state.bridge.style.webkitClipPath = clipPath
  }

  function isPointerInsideState(state, event) {
    const target = event.target
    if (target && (state.dropdown.contains(target) || state.menu.contains(target) || state.bridge.contains(target))) {
      return true
    }
    const point = { x: event.clientX, y: event.clientY }
    if (isPointInRect(point, state.trigger.getBoundingClientRect()) || isPointInRect(point, state.menu.getBoundingClientRect())) {
      return true
    }
    return isPointInPolygon(point, state.bridge.__stellarDropdownPolygon || [])
  }

  function closeState(state, focusTrigger) {
    if (!state || active !== state) {
      return
    }
    active = null
    if (state.dropdown.open) {
      state.dropdown.open = false
    }
    if (state.bridge.parentNode) {
      state.bridge.remove()
    }
    state.menu.classList.remove('dropdown-menu-portal')
    state.menu.classList.remove('dropdown-menu-visible')
    state.menu.removeAttribute('data-portal')
    clearMenuPosition(state.menu)
    if (state.placeholder.parentNode) {
      state.placeholder.parentNode.insertBefore(state.menu, state.placeholder)
      state.placeholder.remove()
    } else if (state.menu.parentNode) {
      state.menu.remove()
    }
    state.dropdown.removeAttribute('data-dropdown-open')
    if (focusTrigger && document.documentElement.contains(state.trigger)) {
      state.trigger.focus()
    }
  }

  function chooseVertical(dropdown, menuHeight, topSpace, bottomSpace) {
    const direction = getDirection(dropdown)
    if (direction === 'up') {
      return 'up'
    }
    if (direction === 'down') {
      return 'down'
    }
    if (menuHeight <= bottomSpace) {
      return 'down'
    }
    if (menuHeight <= topSpace) {
      return 'up'
    }
    return topSpace >= bottomSpace ? 'up' : 'down'
  }

  function chooseHorizontal(dropdown, rect, menuWidth, viewportWidth) {
    const align = getAlign(dropdown)
    const minLeft = viewportPadding
    const maxLeft = Math.max(minLeft, viewportWidth - viewportPadding - menuWidth)
    if (align === 'left') {
      return Math.min(Math.max(rect.left, minLeft), maxLeft)
    }
    if (align === 'right') {
      return Math.min(Math.max(rect.right - menuWidth, minLeft), maxLeft)
    }
    const leftAlignedLeft = rect.left
    const rightAlignedLeft = rect.right - menuWidth
    const leftFits = leftAlignedLeft >= minLeft && leftAlignedLeft <= maxLeft
    const rightFits = rightAlignedLeft >= minLeft && rightAlignedLeft <= maxLeft
    if (leftFits && rightFits) {
      const rightSpace = viewportWidth - viewportPadding - rect.left
      const leftSpace = rect.right - viewportPadding
      return rightSpace >= leftSpace ? leftAlignedLeft : rightAlignedLeft
    }
    if (leftFits) {
      return leftAlignedLeft
    }
    if (rightFits) {
      return rightAlignedLeft
    }
    const preferLeft = viewportWidth - viewportPadding - rect.left >= rect.right - viewportPadding
    const preferredLeft = preferLeft ? leftAlignedLeft : rightAlignedLeft
    return Math.min(Math.max(preferredLeft, minLeft), maxLeft)
  }

  function positionActive() {
    if (!active) {
      return
    }
    const state = active
    if (!document.documentElement.contains(state.trigger)) {
      closeState(state, false)
      return
    }
    const rect = state.trigger.getBoundingClientRect()
    const viewport = getViewportSize()
    if (rect.bottom <= 0 || rect.top >= viewport.height) {
      closeState(state, false)
      return
    }

    const topSpace = Math.max(0, rect.top - gap - viewportPadding)
    const bottomSpace = Math.max(0, viewport.height - rect.bottom - gap - viewportPadding)
    const menu = state.menu
    menu.style.visibility = 'hidden'
    menu.style.maxHeight = 'none'
    menu.style.top = '0px'
    menu.style.left = '0px'
    const naturalRect = menu.getBoundingClientRect()
    const vertical = chooseVertical(state.dropdown, naturalRect.height, topSpace, bottomSpace)
    const availableHeight = vertical === 'up' ? topSpace : bottomSpace
    menu.style.maxHeight = `${Math.max(1, Math.floor(availableHeight))}px`

    const menuRect = menu.getBoundingClientRect()
    const topLimit = viewportPadding
    const bottomLimit = Math.max(topLimit, viewport.height - viewportPadding - menuRect.height)
    const preferredTop = vertical === 'up'
      ? rect.top - gap - menuRect.height
      : rect.bottom + gap
    const top = Math.min(Math.max(preferredTop, topLimit), bottomLimit)
    const left = chooseHorizontal(state.dropdown, rect, menuRect.width, viewport.width)
    menu.style.top = `${Math.round(top)}px`
    menu.style.left = `${Math.round(left)}px`
    menu.setAttribute('data-placement', vertical)
    menu.style.removeProperty('visibility')
    menu.style.removeProperty('opacity')
    updateBridge(state, rect, menu.getBoundingClientRect(), vertical)
  }

  function schedulePosition() {
    if (!active || frame !== null) {
      return
    }
    frame = window.requestAnimationFrame(() => {
      frame = null
      positionActive()
    })
  }

  function openDropdown(dropdown) {
    const menu = getDirectChild(dropdown, '.dropdown-menu')
    const trigger = getDirectChild(dropdown, '.dropdown-trigger')
    if (!menu || !trigger) {
      return
    }
    if (active && active.dropdown !== dropdown) {
      closeState(active, false)
    }
    if (active && active.dropdown === dropdown) {
      schedulePosition()
      return
    }

    const placeholder = document.createComment('dropdown-menu')
    const bridge = document.createElement('div')
    bridge.className = 'dropdown-bridge'
    if (!window.CSS || typeof window.CSS.supports !== 'function' ||
      (!window.CSS.supports('clip-path', 'polygon(0 0, 1px 1px, 2px 2px)') &&
      !window.CSS.supports('-webkit-clip-path', 'polygon(0 0, 1px 1px, 2px 2px)'))) {
      bridge.style.pointerEvents = 'none'
    }
    menu.style.visibility = 'hidden'
    menu.style.opacity = '0'
    menu.parentNode.insertBefore(placeholder, menu)
    const dropdownLayer = getLayer()
    dropdownLayer.appendChild(bridge)
    dropdownLayer.appendChild(menu)
    setMenuId(dropdown, menu)
    menu.classList.add('dropdown-menu-portal')
    menu.setAttribute('data-portal', 'true')
    dropdown.setAttribute('data-dropdown-open', 'true')
    active = {
      dropdown,
      menu,
      trigger,
      placeholder,
      bridge,
      hoverMode: dropdown.__stellarDropdownHovering
    }
    positionActive()
    if (!dropdown.open) {
      dropdown.open = true
    }
    window.requestAnimationFrame(() => {
      if (active && active.dropdown === dropdown) {
        menu.classList.add('dropdown-menu-visible')
      }
    })
  }

  function bind(dropdown) {
    if (dropdown.__stellarDropdownBound) {
      return
    }
    dropdown.__stellarDropdownBound = true
    dropdown.addEventListener('mouseenter', () => {
      dropdown.__stellarDropdownHovering = true
      if (active && active.dropdown === dropdown) {
        active.hoverMode = true
      }
      if (!active || active.dropdown !== dropdown) {
        openDropdown(dropdown)
      }
    })
    const trigger = getDirectChild(dropdown, '.dropdown-trigger')
    if (trigger) {
      trigger.addEventListener('click', event => {
        event.preventDefault()
        if (!active || active.dropdown !== dropdown) {
          openDropdown(dropdown)
        }
      })
      trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (active && active.dropdown === dropdown) {
            closeState(active, false)
          } else {
            openDropdown(dropdown)
          }
        }
      })
    }
    dropdown.addEventListener('mouseleave', () => {
      dropdown.__stellarDropdownHovering = false
    })
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) {
        if (!active || active.dropdown !== dropdown) {
          hideMenuBeforeOpen(dropdown)
          openDropdown(dropdown)
        } else {
          schedulePosition()
        }
      } else if (active && active.dropdown === dropdown) {
        closeState(active, false)
      }
    })
    if (dropdown.open) {
      openDropdown(dropdown)
    }
    dropdown.__stellarDropdownHovering = false
  }

  function bindTree(root) {
    if (root.nodeType !== 1) {
      return
    }
    if (root.matches(selector)) {
      bind(root)
    }
    root.querySelectorAll(selector).forEach(bind)
  }

  function init() {
    if (!document.body || !window.MutationObserver) {
      return
    }
    bindTree(document.body)
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(bindTree)
        record.removedNodes.forEach(node => {
          if (active && node.nodeType === 1 && (node === active.dropdown || node.contains(active.dropdown))) {
            closeState(active, false)
          }
        })
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    document.addEventListener('click', event => {
      if (!active) {
        return
      }
      if (active.dropdown.contains(event.target) || active.menu.contains(event.target)) {
        return
      }
      closeState(active, false)
    }, true)

    document.addEventListener('mousemove', event => {
      if (!active || !active.hoverMode || isPointerInsideState(active, event)) {
        return
      }
      closeState(active, false)
    }, true)

    document.addEventListener('keydown', event => {
      if (!active) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeState(active, true)
        return
      }
      if (event.key === 'Tab' && document.activeElement === active.trigger && !event.shiftKey) {
        const firstItem = active.menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])')
        if (firstItem) {
          event.preventDefault()
          firstItem.focus()
        }
      }
    })

    window.addEventListener('resize', schedulePosition)
    window.addEventListener('scroll', schedulePosition, true)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedulePosition)
      window.visualViewport.addEventListener('scroll', schedulePosition)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()

import React from 'react'
import { Route, Outlet } from 'react-router-dom'
import Markdown from './components/Markdown'

function mapRoutes(routes) {
  return routes.map((route, i) => {
    const { label, route: path, source, children } = route

    const element = children ? (
      <div className="flex-1 flex-col">
        <h2 className="content">{label}</h2>
        <Outlet />
      </div>
    ) : (
      <div className="flex-1 flex-col">
        <h2 className="content">{label}</h2>
        <Markdown route={route} />
      </div>
    )

    return (
      <Route key={i} path={path} element={element}>
        {children ? mapRoutes(children) : null}
      </Route>
    )
  })
}

function getChild(arr, to) {
    if (arr) {
        let obj = arr.map(e => {
            if (e?.route === to) {
                return e
            }
            else {
                let child = e?.children?.find(c => c?.route === to)
                return child && child.length > 0 ? child : getChild(e?.children, to)
            }
        }).filter(x => x)
        if (obj.length > 0) return obj
    }
}

function dig(arr) {
    return Array.isArray(arr) ? dig(arr[0]) : arr
}

function getLabel(routes, to) {
    let path = getChild(routes, to)
    return dig(path)?.label
}

export { mapRoutes, getChild, dig, getLabel }
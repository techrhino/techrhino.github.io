import React from 'react'
import List from '@mui/material/List'
import Link from '@mui/material/Link'
import ListItem from '@mui/material/ListItem'
import Collapse from '@mui/material/Collapse'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { getLabel } from '../functions'

const LinkRouter = (props) => <Link {...props} component={RouterLink} style={{color: 'var(--primary)'}} />

export default function NavigationSidebar({ routes = [], children }) {
    const location = useLocation()
    const pathnames = location.pathname.split('/').filter((x) => x)

    function ListItemLink(props) {
        let { item, to, depth, ...other } = props
        let { label } = item
        let [open, setOpen] = React.useState(depth < 2)

        return (
            <>
                <li>
                    <ListItem
                        to={to}
                        {...other}
                        button
                        component={RouterLink}
                        onClick={(e) => {
                            if (!item?.children) {
                                window.scrollTo({ top: 0 })
                            }
                            setOpen((prevOpen) => !prevOpen)
                        }}
                    >
                        <ListItemText primary={label} />
                        {item?.children && open != null ? (open ? <ExpandLess /> : <ExpandMore />) : null}
                    </ListItem>
                </li>
                {item?.children ? (
                    <Collapse component="li" in={open} timeout="auto" unmountOnExit>
                        <List disablePadding>
                            {item.children.map((e, i) => (
                                <ListItemLink
                                    key={i}
                                    item={e}
                                    to={e.route}
                                    depth={depth + 1}
                                    style={{ paddingLeft: 16 + 16 * (depth + 1) }}
                                />
                            ))}
                        </List>
                    </Collapse>
                ) : null}
            </>
        )
    }

    return (
        <>
            <Breadcrumbs aria-label="breadcrumb" style={{ color: 'var(--primary)' }}>
                <LinkRouter to="/">Home</LinkRouter>
                {pathnames.map((e, i) => {
                    const to = `/${pathnames.slice(0, i + 1).join('/')}`
                    return i === pathnames.length - 1 ? (
                        <Typography key={to}>
                            {getLabel(routes, to)}
                        </Typography>
                    ) : (
                        <LinkRouter to={to} key={to}>
                            {getLabel(routes, to)}
                        </LinkRouter>
                    )
                })}
            </Breadcrumbs>

            <div className="container mb-10 flex flex-row">
                <nav className="navigation flex-1" aria-label="mailbox folders" style={{ minWidth: '300px' }}>
                    <List>
                        {routes.map((e, i) => (
                            <ListItemLink key={i} item={e} to={e.route} depth={0} />
                        ))}
                    </List>
                </nav>
                {children}
            </div>
        </>
    )
}

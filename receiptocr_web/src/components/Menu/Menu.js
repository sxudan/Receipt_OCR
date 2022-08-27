import "./Menu.css"
import { useState, useEffect } from 'react';
function Menu(props) {

    const [showMenu, setShowMenu] = useState(false)

    useEffect(() => {
        setShowMenu(false)
    }, [props.interrupt])

    return(
        <div className="menu">
            <span className="menu-button" onClick={(e) => {
                // window.document.body.click()
                e.stopPropagation()
                setShowMenu((prev) => !prev)
            }}>
            ⋮
            </span>
            
            {
                showMenu ? <ul className="menu-items-wrapper">
                {
                    props.items.map((x,i) => {
                        return (
                            <div key={i}>
                                <li className="menu-item" onClick={(e) => {
                                    e.stopPropagation()
                                    window.document.body.click()
                                    props.onSelected(x,i)
                                }}>{x}</li>
                                {
                                    (i == (props.items.length -1)) ? <></> : <hr/>
                                }
                            </div>
                        )
                    })
                }
            </ul> : <></>
            }
        </div>
        )
    }
    
    export default Menu
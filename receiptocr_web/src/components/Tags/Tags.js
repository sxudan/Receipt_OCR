import "./Tags.css"
function Tags(props) {
    return (
        <div className="tags">
            <p style={{backgroundColor: props.bgColor || "blue", color: props.color || "white"}}>{props.text}</p>
        </div>
    )
}

export default Tags;
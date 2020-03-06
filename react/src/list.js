class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            items: [],
        }
    }

    componentDidMount() {
        list.addEventListener('dblclick', (event) => {
            console.log(event.target)
        })

        ipcRenderer.on('item:add', (event, item) => {
            var newItems = this.state.items
            newItems.push(item)
            this.setState({
                items: newItems
            })
            console.log(this.state.items)
        })
        ipcRenderer.on('item:clear', () => {
            this.setState({
                items: [],
            })
        })
    }

    render() {
        return (
            <ul>
                {this.state.items.map((item, i) => {
                    return (<li key={i}>{item}</li>)
                })}
            </ul>
        )
    }
}

ReactDOM.render(React.createElement(List), document.getElementById('list'))
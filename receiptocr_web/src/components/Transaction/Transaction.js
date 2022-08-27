import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import { useEffect, useState } from 'react';
import Tags from '../Tags/Tags';
import Button from 'react-bootstrap/esm/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Menu from '../Menu/Menu';



function Transaction(props) {
  
  const [data, setData] = useState({})
  const [interrupt, setInterrupt] = useState(Math.random())
  window.document.body.onclick = (e) => {
    setInterrupt(Math.random())
  }
  
  useEffect(() => {
    if(props.data) {
      var newData = {}
      props.data.map((x) => {
        if(newData[x.date]) {
          newData[x.date].push(x)
        } else {
          newData[x.date] = [x]
        }
      })
      setData(newData)
      console.log(newData)
    }
  }, [props.data])
  
  return (
    
    <div className="transaction_block">
    <Container>
    <br/>
    <Card style={{ width: '100%' }}>
    <Card.Header><h6>Recent Receipts</h6></Card.Header>
    </Card>
    {
      Object.keys(data).length > 0 ? Object.keys(data).sort().reverse().map((k, index) => {
        return (
          <div key={index}>
          <br/>
          <Card style={{ width: '100%' }}>
          <Card.Header>{k}</Card.Header>
          <ListGroup key={index} variant="flush">
          {
            data[k].map((x,i) => {
              return (
                <ListGroup.Item key={i}>
                <Row>
                <Col xxl={8} sm={9} xs={9}>
                <Row><h6>{x.category}</h6></Row>
                <Row><p>{x.date}</p></Row>
                </Col>
                <Col xxl={3} sm={3} xs={3} style={{color: x.type === "income" ? "green" : "red"}}><p>{x.currency + x.amount}</p></Col>
                <Col xxl={1} sm={1} xs={12} >
                <Row><Menu interrupt={interrupt} items={["View", "Delete"]} onSelected={(value,i) => {
                  switch(i) {
                    case 0:
                    window.open(x.image)
                    break;
                    case 1:
                    if(window.confirm("Delete this receipt?")) props.onDelete(x)
                    break;
                  }
                }}/></Row>
                {/* <Tags onClick={() => {
                  window.open(x.image)
                }} color="white" bgColor="green" text={x.image.includes("pdf")? "pdf": "image"}/>
                <Tags bgColor="red" onClick={(e) => {
                  e.stopPropagation()
                  if(window.confirm("Delete this receipt?")) props.onDelete(x)
                }} text="delete"/> */}
                </Col>
                </Row>
                </ListGroup.Item>
                )
              })
            }
            
            </ListGroup>
            </Card>
            </div>
            )
          }) :  <>
          <p>No data available</p>
          </>
        }
        <br/>
        </Container>
        </div>
        )
      }
      
      export default Transaction;
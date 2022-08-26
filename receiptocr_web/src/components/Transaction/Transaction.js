import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import { useEffect, useState } from 'react';
import Tags from '../Tags/Tags';
import Button from 'react-bootstrap/esm/Button';



function Transaction(props) {
  
  const [data, setData] = useState({})
  
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
                <Col sm={8}>
                <Row><h6>{x.category}</h6></Row>
                <Row><p>{x.date}</p></Row>
                </Col>
                <Col sm={3} style={{color: x.type === "income" ? "green" : "red"}}><p>{x.currency + x.amount}</p></Col>
                <Col sm={1}>
                <Tags onClick={() => {
                  window.open(x.image)
                }} color="white" bgColor="red" text={x.image.includes("pdf")? "pdf": "image"}/>
                <Tags onClick={(e) => {
                  e.stopPropagation()
                  if(window.confirm("Delete this receipt?")) props.onDelete(x)
                }} text="delete"/>
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
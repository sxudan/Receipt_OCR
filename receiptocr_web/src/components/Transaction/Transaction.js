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
                  <Row>
                    <p style={{color: x.type === "income" ? "green" : "red"}}>{x.currency + x.amount}</p>
                  </Row>
                  <Row>
                    <p><b>{x.category} | {x.merchant}</b></p>
                  </Row>
                  <Row>
                    <p>{x.date}</p>
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
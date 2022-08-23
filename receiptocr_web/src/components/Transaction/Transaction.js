import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Tags from '../Tags/Tags';


function Transaction(props) {
    const [transactions, setTransactions] = useState([])

    function getTransactions() {
        axios.get(`https://new-project-1557054001172.firebaseio.com/Receipts/${props.profile.googleId}.json`)
          .then(res => {
            var t = []
            var amt = 0
            if(res.data) {
              for(var key in res.data.transactions) {
                if(res.data.transactions[key].type == "income") {
                  amt += parseFloat(res.data.transactions[key].amount)
                  console.log(amt)
                } else {
                  amt -= parseFloat(res.data.transactions[key].amount)
                  console.log(amt)
                }
                t.push(res.data.transactions[key])
              }
            }
            props.onBalance({...props.balance, amount: Math.round(amt * 100) / 100})
            t.sort((a,b) => {
              var d1 = new Date(a.date), d2 = new Date(b.date)
              return d1 < d2
            })
            setTransactions(t)
          })
      }
    
      useEffect(() => () => {
        console.log("fetching transactions")
        getTransactions()
      }, [])

    return (
        <div className="transaction_block">
        <Container>

        <Card style={{ width: '100%' }}>
          <Card.Header><h6>Recent Receipts</h6></Card.Header>
          <ListGroup variant="flush">
          {
            transactions.map((x,i) => {
              return (
                <ListGroup.Item key={i} onClick={() => {
                  window.open(x.image)
                }}>
                <Row>
                  <Col sm={8}>
                    <Row><h6>{x.category}</h6></Row>
                    <Row><p>{x.date}</p></Row>
                  </Col>
                  <Col sm={3} style={{color: x.type === "income" ? "green" : "red"}}>{x.amount}</Col>
                  <Col sm={1}>
                    <Tags color="white" bgColor="red" text={x.image.includes("pdf")? "pdf": "image"}/>
                  </Col>
                </Row>
            </ListGroup.Item>
              )
            })
          }
            
          </ListGroup>
        </Card>
        </Container>
      </div>
    )
}

export default Transaction;
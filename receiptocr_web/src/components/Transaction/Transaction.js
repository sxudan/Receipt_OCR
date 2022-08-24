import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Tags from '../Tags/Tags';
import {dbRef} from '../../firebase'
import {get, child} from 'firebase/database'


function Transaction(props) {
    const [transactions, setTransactions] = useState([])

    function getTransactions() {

      get(child(dbRef, `Receipts/${props.profile.googleId}`)).then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          var t = []
            var amt = 0
            const data = snapshot.val()
            if(data) {
              for(var key in data.transactions) {
                if(data.transactions[key].type == "income") {
                  amt += parseFloat(data.transactions[key].amount)
                  console.log(amt)
                } else {
                  amt -= parseFloat(data.transactions[key].amount)
                  console.log(amt)
                }
                t.push(data.transactions[key])
              }
            }
            props.onBalance({...props.balance, amount: Math.round(amt * 100) / 100})
            t.sort((a,b) => {
              var d1 = new Date(a.date), d2 = new Date(b.date)
              return d1 < d2
            })
            setTransactions(t)
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
      });

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
                  <Col sm={3} style={{color: x.type === "income" ? "green" : "red"}}>{x.currency + x.amount}</Col>
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
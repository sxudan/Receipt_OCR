import logo from './logo.svg';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import './App.css';
import { useEffect, useState } from 'react';

import TransactionAdder from './components/Transaction/TransactionAdder';
import Transaction from './components/Transaction/Transaction';
import LoadingBar from './components/LoadingBar';
import GoogleLogin, { GoogleLogout } from 'react-google-login';
import Tags from './components/Tags/Tags';

function App() {
  
  const [balance, setBalance] = useState({
    currency: '$',
    amount: 0.0
  })
  
  const [isTransactionAdder, setIsTransactionAdder] = useState(false)
  const [file, setFile] = useState({})
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({})
  
  
  function addFile(e) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = ["image/*", "application/pdf"]
    
    input.onchange = e => { 
      var file = e.target.files[0]; 
      setFile(file)
      setIsTransactionAdder(true)
    }
    input.click();
  }
  
  const loginResponse = (response) => {
    console.log(response)
    if(response && response.profileObj) {
      setProfile(response.profileObj)
    }
  }
  
  const logoutResponse = (response) => {
    console.log(response);
    setProfile({})
  }
  
  
  return (
    
    <div className="App">
      <Navbar bg="dark" variant="dark">
      <Container>
      <Navbar.Brand href="#home">
      <img
      alt=""
      src={logo}
      width="30"
      height="30"
      className="d-inline-block align-top"
      />{' '}
      Receipt Bank <Tags bgColor="transparent" text={profile.email || ""} />
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
      <Navbar.Text>
      {(Object.keys(profile).length == 0) ? <></> : <GoogleLogout
        clientId="484549045450-te7h1rkjq4492jjiv0t2f06lpnn6kr47.apps.googleusercontent.com"
        buttonText="Logout"
        onLogoutSuccess={logoutResponse}
        ></GoogleLogout>}
        </Navbar.Text>
        </Navbar.Collapse>
        </Container>
        </Navbar>
        
        {
          (Object.keys(profile).length == 0) ? 
          <div className='login'>
          <GoogleLogin
          className='center'
          clientId="484549045450-te7h1rkjq4492jjiv0t2f06lpnn6kr47.apps.googleusercontent.com"
          buttonText="Login"
          scope='profile email'
          onSuccess={loginResponse}
          onFailure={loginResponse}
          cookiePolicy={'single_host_origin'}
          />
          </div> :  
          <>
          <Container>
          <Card>
          <Card.Body><h1>Total: { (balance.amount < 0) ? "-" + (balance.currency + Math.abs(balance.amount)) : (balance.currency + balance.amount)}</h1></Card.Body>
          </Card>
          </Container>
          <Row>
          {
            !loading ? <Transaction profile={profile} balance={balance} onBalance={(blnc) => {
              setBalance(blnc)
              setLoading(false)
            }}/> : <LoadingBar />
          }
          </Row>
          <button className='fab' onClick={addFile}>
          +
          </button>
          { isTransactionAdder ? <TransactionAdder profile={profile} file={file} onClose={() => {
            setIsTransactionAdder(false)
            setLoading(true)
          }}/> : <></>}
          </>
        }
      
      </div>
      );
    }
    
    export default App;
    
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
import {dbRef, auth} from './firebase'
import {get, child, remove} from 'firebase/database'
import axios from 'axios'
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import Button from 'react-bootstrap/esm/Button';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from './firebase';


function App() {
  
  const [balance, setBalance] = useState({
    currency: '$',
    amount: 0.0
  })
  
  const [isTransactionAdder, setIsTransactionAdder] = useState(false)
  const [file, setFile] = useState({})
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({})
  const [transactions, setTransactions] = useState([])
  const [ocrData, setOcrData] = useState({})
  
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly', 'https://www.googleapis.com/auth/cloud-platform');
  auth.onAuthStateChanged((user) => {
    console.log("on change called")
    if (user) {
      // User logged in already or has just logged in.
      
      if(!profile.uid) {
        loginResponse(user)
      }
    } else {
      // User not logged in or has just logged out.
      if(profile.uid) {
        logoutResponse()
      } else {
        setLoading(false)
      }
    }
  });

  function removeImage(filename) {
    console.log("delete image ", filename)
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `/Receipts/${profile.uid}/${filename}`)
      deleteObject(storageRef).then(() => {
        resolve()
      }).catch(err => reject(err))
    })
  }

  function removeTransaction(x) {
    setLoading(true)
    removeImage(x.filename).then(() => {
      console.log("removing transaction", x.id)
      remove(child(dbRef, `Receipts/${profile.uid}/transactions/${x.id}`)).then(() => {
        getTransactions()
      }).catch((err) => console.log(err))
    }).catch(err => {
      console.log(err)
      setLoading(false)
    })
  }
  
  function getTransactions() {
    console.log("fetching transactions of " + profile.uid)
    setLoading(true)
    get(child(dbRef, `Receipts/${profile.uid}`)).then((snapshot) => {
      if (snapshot.exists()) {
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
            t.push({...data.transactions[key], id: key})
          }
        }
        setBalance({...balance, amount: Math.round(amt * 100) / 100})
        t.sort((a,b) => {
          var d1 = new Date(a.date), d2 = new Date(b.date)
          return d1 < d2
        })
        setTransactions(t)
        console.log(t);
      } else {
        console.log("No data available");
        setTransactions([])
        setBalance({...balance, amount: 0})
      }
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      setLoading(false)
    });
  }
  
  function fetchOCRInfo(file) {
    return new Promise((resolve, reject) => {
      setLoading(true)
      let formData = new FormData();
      formData.append('datafile', file);
      // the image field name should be similar to your api endpoint field name
      // in my case here the field name is customFile
      
      
      axios.post(
        "http://ec2-18-116-204-238.us-east-2.compute.amazonaws.com/getInfo",
        // "http://192.168.1.205/getInfo",
        formData,
        {
          headers: {
            "Content-type": "multipart/form-data",
          },                    
        }
        )
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        }).finally(() => {
          setLoading(false)
        })
      })
    }
    
    
    function addFile(e) {
      var input = document.createElement('input');
      input.type = 'file';
      input.id = 'dataFile'
      input.accept = "image/*,application/pdf"
      input.style = "display: none"
      document.body.appendChild(input);


      input.addEventListener("change", (e) => {
        document.body.removeChild(input)
        var file = e.target.files[0]; 
        setFile(file)
        const c = window.confirm("Do you want to use OCR tool?")
        if(c) {
          fetchOCRInfo(file).then((data) => {
            setIsTransactionAdder(true)
            setOcrData(data)
          }).catch(err => {
            console.log(err)
            setIsTransactionAdder(true)
          })
        } else {
          setIsTransactionAdder(true)
        }
      })
      
      // input.onchange = e => { 
        
      // }
      input.click();
    }
    
    const loginResponse = (user) => {
      console.log(user)
      setLoading(false)
      setProfile(user)
    }
    
    const logoutResponse = () => {
      console.log("Logged out")
      setLoading(false)
      setProfile({})
    }
    
    function onGoogleLogout() {
      signOut(auth).then(() => {
        logoutResponse()
      }).catch((error) => {
        // An error happened.
      });
    }
    
    function onGoogleLogin() {
      signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        console.log(credential)
        if(auth.currentUser) {
          loginResponse(auth.currentUser)
        }
        
      }).catch((error) => {
        alert(error)
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
    }
    
    useEffect(() => {
      console.log(profile)
      if(profile.uid) {
        getTransactions()
      } else {
        setTransactions([])
        setBalance({...balance, amount: 0})
      }
    }, [profile])

    
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
        <Navbar.Text>{profile.displayName}</Navbar.Text>
        <Navbar.Text><img className='nav_thumb' src={profile.photoURL} /></Navbar.Text>
      <Navbar.Text>
      {(Object.keys(profile).length == 0) ? <></> : <Button onClick={onGoogleLogout}>Logout</Button>
      
      }
        </Navbar.Text>
        </Navbar.Collapse>
        </Container>
        </Navbar>
        
        {
          (Object.keys(profile).length == 0) ? 
          <div className='login'>
            {
              loading ? <LoadingBar /> : <Button onClick={onGoogleLogin}>Login with Google</Button>
            }
          </div> :  
          <div className='main-content'>
          <Container>
          <Card>
          <Card.Body><h1>Total: { (balance.amount < 0) ? "-" + (balance.currency + Math.abs(balance.amount)) : (balance.currency + balance.amount)}</h1></Card.Body>
          </Card>
          </Container>
          <Row>
          { loading ? <LoadingBar /> : <Transaction data={transactions} onDelete={removeTransaction}/>}
          </Row>
          <button className='fab' onClick={addFile}>
          +
          </button>
          { 
            isTransactionAdder ? <TransactionAdder profile={profile} ocrData={ocrData} file={file} onClose={() => {
              setIsTransactionAdder(false)
              getTransactions()
            }}/> : <></>
          }
          </div>
        }
        </div>
        );
      }
      
      export default App;
      
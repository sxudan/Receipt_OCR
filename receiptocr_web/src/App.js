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
import Tags from './components/Tags/Tags';
import {dbRef, auth} from './firebase'
import {get, child, remove} from 'firebase/database'
import axios from 'axios'
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import Button from 'react-bootstrap/esm/Button';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from './firebase';
import Compressor from 'compressorjs'

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
      console.log("deleted image")
    }).catch(err => {
      console.log(err)
      // setLoading(false)
    }).finally(() => {
      console.log("removing transaction", x.id)
      remove(child(dbRef, `Receipts/${profile.uid}/transactions/${x.id}`)).then(() => {
        getTransactions()
      }).catch((err) => {
        alert(err)
      })
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
            // if(data.transactions[key].type == "income") {
            //   amt += parseFloat(data.transactions[key].amount)
            //   console.log(amt)
            // } else {
            //   amt -= parseFloat(data.transactions[key].amount)
            //   console.log(amt)
            // }
            t.push({...data.transactions[key], id: key})
          }
        }
        // setBalance({...balance, amount: Math.round(amt * 100) / 100})
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
      
      console.log("calling api url " + process.env.REACT_APP_OCR_ENDPOINT + "getInfo")
      axios.post(
        process.env.REACT_APP_OCR_ENDPOINT + "getInfo",
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
      input.name = 'datafile'
      input.accept = "image/*,application/pdf"
      input.style = "display: none"
      document.body.appendChild(input);
      setFile({})
      setOcrData({})


      input.addEventListener("change", (e) => {
        document.body.removeChild(input)
        var file = e.target.files[0]; 
        setFile(file)
        const c = window.confirm("Do you want to use OCR tool?")
        
        function sendForOCR(file) {
          fetchOCRInfo(file).then((data) => {
            if(!data.data.ocr_success) alert("Failed to capture text!")
            setIsTransactionAdder(true)
            setOcrData(data)
          }).catch(err => {
            console.log(err)
            alert(err)
            setIsTransactionAdder(true)
          })
        }

        function compressAndOCRImage(image) {
          console.log("compressing an image")
          new Compressor(image, {
            quality: 0.1, // 0.6 can also be used, but its not recommended to go below.
            success: (compressedImage) => {
              // compressedResult has the compressed file.
              // Use the compressed file to upload the images to your server.  
              console.log(compressedImage)      
              sendForOCR(compressedImage)
            },
            error: (err) => {
              alert(err)
              sendForOCR(image)
            }
          })
        }

        if(c) {
          console.log(file.type)
          if(file.type.includes("image")) {
            compressAndOCRImage(file)
          } else {
            console.log("not an image")
            sendForOCR(file)
          }        
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
      setIsTransactionAdder(false)
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

    console.log(process.env)
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
      {(Object.keys(profile).length == 0) ? <></> : 
      <>
        <Navbar.Text>{profile.displayName}</Navbar.Text>
        <Navbar.Text><img className='nav_thumb' src={profile.photoURL} /></Navbar.Text>
        <Button onClick={onGoogleLogout}>Logout</Button>
      </>
      
      
      }
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
          {/* <Container>
          <Card>
          <Card.Body><h1>Total: { (balance.amount < 0) ? "-" + (balance.currency + Math.abs(balance.amount)) : (balance.currency + balance.amount)}</h1></Card.Body>
          </Card>
          </Container> */}
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
      
import Container from "react-bootstrap/Container"
import "./TransactionAdder.css"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Button from "react-bootstrap/Button"
import { ref, uploadBytesResumable, getDownloadURL  } from "firebase/storage";
import { storage } from '../../firebase';
import { useEffect, useState } from "react"
import { child, push, update } from "firebase/database";
import { dbRef } from "../../firebase"
import LoadingBar from "../LoadingBar"

function updateDB(id, data) {
    const newPostKey = push(child(dbRef, `Receipts/${id}/transactions/`)).key;
    
    // Write the new post's data simultaneously in the posts list and the user's post list.
    const updates = {};
    updates[`Receipts/${id}/transactions/` + newPostKey] = data;
    
    return update(dbRef, updates);
}

function TransactionAdder(props) {
    
    
    const [progress, setProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState({
        category: "Others",
        type: "expense",
        amount: 0,
        currency: "$",
        date: getCurrentDate(),
        image: ""
        
    })
    
    useEffect(() => {
        console.log(")))", props.ocrData)
        if(props.ocrData.data) {
            console.log("showing ocr data",props.ocrData)
            var currentDate = ""
            if(props.ocrData.data.ocr_date != "") {
                const d = props.ocrData.data.ocr_date.split("/") || []
                const month = d[1] || ""
                const year = d[2] || ""
                const date = d[0] || ""
                currentDate = `${year}-${month}-${date}`
            } else {
                currentDate = getCurrentDate()
            }
            console.log(currentDate)
            setData({...data, amount: props.ocrData.data.ocr_amount, date: currentDate})
        }
    }, [props.ocrData])
    
    
    function getCurrentDate() {
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        if (month < 10) month = "0" + month;
        if (day < 10) day = "0" + day;
        var today = year + "-" + month + "-" + day; 
        return today
    }
    
    function handleUpload(id, file, getProgress) {
        return new Promise((resolve, reject) => {
            console.log(file)
            const storageRef = ref(storage, `/Receipts/${id}/${file.name}`)
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const percent = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        );
                        
                        // update progress
                        getProgress(percent)
                    },
                    (err) => reject(err),
                    () => {
                        // download url
                        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                            resolve(url)
                        });
                    }
                    ); 
                })
            }
            
            
            return (
                <div className="popup">
                <div className="content">
                <Row className="form-field">
                <select name="Type" defaultValue={data.type} onChange={(e) => {
                    setData(
                        (prevData) => {
                            return {
                                ...prevData, 
                                type: e.target.value,
                            }
                        })
                    }}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    </select>
                    
                    </Row>
                    
                    <Row className="form-field">
                    <select name="Category" defaultValue={data.category} onChange={(e) => {
                        console.log(data)
                        setData(
                            (prevData) => {
                                return {
                                    ...prevData, 
                                    category: e.target.value,
                                }
                            })
                            
                        }}>
                        <option value="Grocery">Grocery</option>
                        <option value="Salary">Salary</option>
                        <option value="Restaurants">Restaurants</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Health">Health</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Others">Others</option>
                        </select>
                        
                        </Row>
                        
                        <Row className="form-field">
                        <p className="label">Amount</p>
                        <input type="number" value={data.amount} onChange={(e) => {
                            // amount = Math.abs(parseInt(e.target.value))\
                            setData(
                                (prevData) => {
                                    return {
                                        ...prevData, 
                                        amount: Math.abs(parseFloat(e.target.value)),
                                    }
                                })
                        }}/>
                        </Row>
                        <Row className="form-field">
                        <input type="date" value={data.date} onChange={(e) => {
                            setData(
                                (prevData) => {
                                    return {
                                        ...prevData, 
                                        date: e.target.value,
                                    }
                                })
                            }}/>
                            </Row>
                            <hr/>
                            
                            
                            <Row>
                            {
                                !isLoading ? <Button onClick={() => {
                                    setIsLoading(true)
                                    handleUpload(props.profile.uid, props.file, (progress) => {
                                        setProgress(progress)
                                    }).then((url) => {
                                        console.log(url)
                                        setData(
                                            (prevData) => {
                                                return {
                                                    ...prevData, 
                                                    image: url,
                                                }
                                            })
                            
                                            console.log({...data,image: url})
                                            updateDB(props.profile.uid, {...data,image: url, filename: props.file.name})
                                            setIsLoading(false)
                                            props.onClose()
                                        }).catch(error => console.log(error))
                                    }
                                }>Upload</Button> : <LoadingBar />
                            }
                            </Row>
                            <br/>
                            <Row><Button variant="danger" onClick={() => {
                                console.log(data)
                                props.onClose()
                            }}>Close</Button></Row>
                            
                            
                            
                            </div>
                            </div>
                            )
                        }
                        
                        export default TransactionAdder;
import './App.css';

import { useEffect, useState, useRef } from 'react';

import { useAuthState } from 'react-firebase-hooks/auth';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

import { Button } from '@mui/material';

const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
const MESSAGING_SENDER_ID = process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.REACT_APP_FIREBASE_APP_ID;
const MEASUREMENT_ID = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;

const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: AUTH_DOMAIN,
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGING_SENDER_ID,
    appId: APP_ID,
    measurementId: MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const auth = getAuth();

const db = getFirestore(app);

const logIn = () => {
    signInWithPopup(auth, provider);
}

const logOut = () => {
    signOut(auth);
}

function App() {
    const [user] = useAuthState(auth);

    return (
        <div className="App" style={{backgroundColor: '#2e2e2e'}}>
            <div className="sidebar">
                <h1>vchat</h1>
                {user ?
                    <div>
                        <SignOut />
                        <img className="sidebar-photo" src={user?.photoURL} alt="" />
                        <div className="sidebar-name">Signed in as: {user?.displayName}</div>
                    </div>
                    :
                    <div>
                        <SignIn />
                    </div>
                }
            </div>

            <div className="chatContainer">
                <Chat />
            </div>

            <div className="sendMessageContainer">
                {user && <SendMessage />}
            </div>

        </div>
    );
}

const SignIn = () => {
    return (
        <div>
            <Button className="signin-button" variant="contained" onClick={logIn}>Sign in with Google</Button>
            <div>Sign in to be able to chat!</div>
        </div>
        //<button className="signin-button" onClick={logIn}>Sign in with Google</button>
    );
}

const SignOut = () => {
    return auth.currentUser && (
        <div className="sidebar-signin">
            <Button className="button" variant="contained" onClick={logOut}>Sign out</Button>
        </div>
    );
}

const Chat = () => {
    const [chat, setChat] = useState([{ text: "Loading Messages...", id: "loading" }]);
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chat]);

    async function getChat(db) {
        const chatData = collection(db, "chat");
        // setChat(chatData.docs.map((doc) => ({...doc.data(), id: doc.id})));
        onSnapshot(query(chatData, orderBy("date")), (chatSnapshot) => {
            setChat(chatSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        });
    }

    useEffect(() => getChat(db), []);

    return (
        <div className="chat-wrapper">
            {chat?.map((message) => (
                <Post key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef}></div>
        </div>
    );
}

const Post = (props) => {
    const [hovering, setHovering] = useState(false);
    var hoverBackground;
    function toggleHover() {
        setHovering(!hovering);
    }
    if (hovering) {
        hoverBackground = { backgroundColor: '#222222' }
    } else {
        hoverBackground = { backgroundColor: '#383b44' }
    }
    return (
        <div className="post" style={hoverBackground} onMouseEnter={toggleHover} onMouseLeave={toggleHover}>
            <img className="profilePhoto" src={props.message.profilePicture} alt="" />
            <div className="post-content">
                <div className="username">
                    {props.message.displayName}
                </div>

                <div className="message-text">{props.message.text}</div>
            </div>
        </div>
    );
}

const SendMessage = () => {
    const [message, setMessage] = useState("");

    const { uid, photoURL, displayName } = auth?.currentUser;

    async function uploadMessage(event) {
        event.preventDefault();

        await addDoc(collection(db, "chat"), {
            date: serverTimestamp(),
            text: message,
            id: uid,
            profilePicture: photoURL,
            displayName: displayName
        });
        setMessage("");
    }

    return (
        <form onSubmit={uploadMessage}>
            <input className="message-field" placeholder="Enter message" type="text" value={message} onChange={(e) => setMessage(e.target.value)}></input>
            <input className="send-button" type="submit" value="Send" onClick={uploadMessage}></input>
        </form>
    );
}

export default App;

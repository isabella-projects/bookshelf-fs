import { useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase-project-config";

export default function useData() {
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [bookValues, setBookValues] = useState({
    title: "",
    author: "",
    pages: "",
    read: false,
  });
  // TODO: Need to clear the file stack. Current.value didnt work out.
  const resetImage = () => {};
  const [currentEditBook, setCurrentEditBook] = useState({});
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEdit(false);
  };
  const handleChange = (prop) => (e) => {
    const checked = e.target.checked ? true : false;
    if (e.target.type !== "checkbox") {
      setBookValues({
        ...bookValues,
        [prop]: e.target.value,
      });
    } else {
      setBookValues({
        ...bookValues,
        [prop]: checked,
      });
    }
  };
  const sendBook = async () => {
    const { uid, photoURL } = getAuth().currentUser;
    const booksRef = collection(getFirestore(), "books");
    const docRef = await addDoc(booksRef, {
      title: bookValues.title,
      author: bookValues.author,
      pages: bookValues.pages,
      read: bookValues.read,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });
    setBookValues({
      title: "",
      author: "",
      pages: null,
      read: false,
    });
    setOpen(false);
  };
  const handleEdit = (book) => {
    setCurrentEditBook(book);
    setOpen(true);
    setIsEdit(true);
    setBookValues({
      title: book.title,
      author: book.author,
      pages: book.pages,
      read: book.read,
    });
  };
  const saveEdit = () => {
    const { uid, photoURL } = getAuth().currentUser;
    const docRef = doc(getFirestore(), "books", currentEditBook.id);
    setDoc(docRef, {
      title: bookValues.title,
      author: bookValues.author,
      pages: bookValues.pages,
      read: bookValues.read,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });
    setOpen(false);
    setIsEdit(false);
    setBookValues({
      title: "",
      author: "",
      pages: null,
      read: false,
    });
  };
  const uploadImage = async (e, book) => {
    e.preventDefault();
    const { uid, photoURL } = getAuth().currentUser;
    let file = e.target.files[0];
    try {
      const filePath = `${getAuth().currentUser.uid}/${book.id}/${file.name}`;
      const newImageRef = ref(storage, filePath);
      console.log(newImageRef);
      const fileSnapshot = await uploadBytesResumable(newImageRef, file);
      const publicImageUrl = await getDownloadURL(newImageRef);
      const docRef = doc(getFirestore(), "books", book.id);
      setDoc(docRef, {
        title: book.title,
        author: book.author,
        pages: book.pages,
        read: book.read,
        createdAt: serverTimestamp(),
        uid,
        photoURL,
        imageURL: publicImageUrl,
        storageUri: fileSnapshot.metadata.fullPath,
      });
    } catch (error) {
      console.error("couldnt fetch image", error);
    }
  };

  return [
    handleEdit,
    handleClickOpen,
    handleClose,
    handleChange,
    sendBook,
    saveEdit,
    open,
    isEdit,
    bookValues,
    uploadImage,
  ];
}

import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import PostUpload from "../shared/PostUpload";
import Post from "../shared/Post";
import { useAuth } from "../shared/AuthContext";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";


function Home() {
  const { jwtToken } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);

  const headers = {
    Authorization: `Bearer ${jwtToken}`,
  };

  useEffect(() => {
    getPostData();
  }, []);

  const getPostData = async () => {
    console.log(Cookies.get('jwt'));
    if (jwtToken) {
      try {
        const response = await fetch("http://localhost:5000/home", {
          method: "GET",
          headers: headers,
        });
        const data = await response.json();
        setPosts(data.posts);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    } else {
      navigate("/");
    }
  };

  const Delete = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/delete/${postId}`, {
        method: "POST",
        headers: headers,
      });

      if (response.ok) {
        console.log("Post deleted successfully");
        // Update the posts state after deletion
        setPosts(posts.filter((post) => post._id !== postId));
      } else {
        console.error("Failed to delete post:", response.statusText);
        window.alert("You are not allowed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const Upload = async (formInputs) => {
    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: headers,
        body: formInputs,
      });

      if (response.ok) {
        const newData = await response.json();
        console.log(newData);
        console.log(posts);
        setPosts([...posts, newData.post]); // Update posts with new data
      } else {
        console.error("File upload failed:", response.statusText);
        window.alert("You are not allowed to make post.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <React.Fragment>
      <Navbar />
      <PostUpload Upload={Upload} />
      <div className="feed">
        {posts.map((post) => (
          <Post
            key={post._id}
            filepath={post.filepath}
            caption={post.caption}
            timestamp={post.timestamp}
            postId={post._id}
            Delete={Delete}
          />
        ))}
      </div>
    </React.Fragment>
  );
}

export default Home;

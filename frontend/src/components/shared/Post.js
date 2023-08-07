import React from 'react';

export default function Post({ filepath, caption, timestamp, postId, Delete}) {
  const imageUrl = `http://localhost:5000/${filepath}`;
  
  const handleDelete = async (event) => {
    event.preventDefault();
    Delete(postId);
  };
  
  return (
    <div className="post">
      <img src={imageUrl} alt="Post" />
      <div className="caption">{caption}</div>
      <div className="buttons">
        <form onSubmit={handleDelete}>
          <button type="submit" className="delete-btn">
            Delete
          </button>
        </form>
      </div>
      <div className="timestamp">Posted {timestamp} </div>
    </div>
  );
}
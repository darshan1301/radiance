import React, { useState } from "react";

export default function PostForm({ Upload }) {
  const [caption, setCaption] = useState("");

  
  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    console.log(formData);

    Upload(formData);
    event.target.reset(); 
    setCaption('');  
  };

  return (
    <div className="postform">
      <form
        id="postForm"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <div className="upload-section">
          <label htmlFor="mediaInput" className="upload-label">
            Upload Media (Image/Video)
          </label>
          <input
            type="file"
            accept="image/*, video/*"
            id="mediaInput"
            name="imageFile"
          />
        </div>
        <textarea
          id="captionInput"
          placeholder="Enter your caption..."
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        ></textarea>
        <button type="submit" >Post</button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import React from "react";
import { useAuth } from "../shared/AuthContext";
import Navbar from "../shared/Navbar";
import { useNavigate } from "react-router-dom";
import Footer from "../shared/Footer";

export default function AdminPanel(props) {
  const { jwtToken } = useAuth();
  const headers = {
    Authorization: `Bearer ${jwtToken}`,
  };

  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    if (jwtToken) {
      try {
        const response = await fetch("http://localhost:5000/user/adminPanel", {
          method: "GET",
          headers: headers,
        });
        const data = await response.json();
        if (response.ok) {
          setUsers(data.users);
        } else {
          window.alert("You don't have access.");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }else {
      navigate("/");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    console.log("updated data", JSON.stringify(users));

    try {
      const response = await fetch("http://localhost:5000/user/updateAccess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(users),
      });

      if (response.ok) {
        window.location.reload();
        console.log("Access permissions updated successfully.");
      } else {
        window.alert("Failed to update access permissions.")
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleChange = (userId, checkbox, permission) => {
    // Extract the name attribute from the checkbox input
    // console.log(userId);
    // console.log(checkbox);
    // console.log(permission);

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId ? { ...user, [permission]: checkbox } : user
      )
    );
  };

  return (
    <React.Fragment>
      <Navbar />
      <div className="admin-panel">
        <form action="/updateAccess" method="POST" onSubmit={handleUpdate}>
          <table>
            <thead>
              <tr>
                <th>Members</th>
                <th>Create</th>
                <th>Read</th>
                <th>Delete</th>
                <th>Admin Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>
                    <input
                      onChange={(event) =>
                        handleChange(user._id, event.target.checked, "create")
                      }
                      type="checkbox"
                      name={`create-${user._id}`}
                      defaultChecked={user.create}
                      value={user.create}
                    />
                  </td>
                  <td>
                    <input
                      onChange={(event) =>
                        handleChange(user._id, event.target.checked, "read")
                      }
                      type="checkbox"
                      name={`read-${user._id}`}
                      defaultChecked={user.read}
                    />
                  </td>
                  <td>
                    <input
                      onChange={(event) =>
                        handleChange(user._id, event.target.checked, "delete")
                      }
                      type="checkbox"
                      name={`delete-${user._id}`}
                      defaultChecked={user.delete}
                    />
                  </td>
                  <td>
                    <input
                      onChange={(event) =>
                        handleChange(
                          user._id,
                          event.target.checked,
                          "adminAccess"
                        )
                      }
                      type="checkbox"
                      name={`adminAccess-${user._id}`}
                      defaultChecked={user.adminAccess}
                    />
                  </td>
                  <input type="hidden" name="userId[]" value={user._id} />
                </tr>
              ))}
            </tbody>
          </table>
          <button type="submit" className="button-adminPanel">
            Save Changes
          </button>
        </form>
      </div>
      <Footer/>
    </React.Fragment>
  );
}

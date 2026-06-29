const API_URL = "https://jsonplaceholder.typicode.com/users";

export async function getUsers() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Unable to load users. Please try again.");
  return response.json();
}

export async function createUser(user) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) throw new Error("Unable to add user.");
  return response.json();
}

export async function updateUser(id, user) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) throw new Error("Unable to update user.");
  return response.json();
}

export async function deleteUser(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Unable to delete user.");
  return true;
}

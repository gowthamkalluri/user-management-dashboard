import React, { Component } from "react";
import UserDashboard from "./components/UserDashboard";
import "./App.css";

class App extends Component {
  render() {
    return (
      <main className="app">
        <UserDashboard />
      </main>
    );
  }
}

export default App;

import React, { Fragment } from "react";
import "./styles.css";
import { NavLink } from "react-router-dom";

export default function App() {
  return (
    <Fragment>
      <nav className="navbar">
        <NavLink exact to="/" activeClassName="selected">
          Home
        </NavLink>
        <NavLink to="/about" activeClassName="selected">
          About us
        </NavLink>
        <NavLink to="/contact" activeClassName="selected">
          Contact
        </NavLink>
      </nav>
    </Fragment>
  );
}

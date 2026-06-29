import React, { Component } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userApi";
import "./UserDashboard.css";

const emptyForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  website: "",
  company: "",
  city: "",
};

class UserDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      users: [],
      loading: true,
      error: "",
      success: "",
      search: "",
      filtersOpen: false,
      filters: {
        city: "",
        company: "",
      },
      sortField: "name",
      sortDirection: "asc",
      page: 1,
      pageSize: 5,
      modalMode: null,
      form: { ...emptyForm },
      formErrors: {},
      editingId: null,
      deletingUser: null,
      submitting: false,
    };
  }

  componentDidMount() {
    this.loadUsers();
  }

  loadUsers = async () => {
    try {
      const users = await getUsers();
      this.setState({ users, loading: false, error: "" });
    } catch (error) {
      this.setState({
        loading: false,
        error: error.message,
      });
    }
  };

  normalizeUser = (user) => ({
    id: user.id,
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    website: user.website || "",
    company: {
      name: user.company?.name || user.company || "",
    },
    address: {
      city: user.address?.city || user.city || "",
    },
  });

  getPreparedUsers = () => {
    const { users, search, filters, sortField, sortDirection } = this.state;
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const normalized = this.normalizeUser(user);
        const searchable = [
          normalized.name,
          normalized.username,
          normalized.email,
          normalized.phone,
          normalized.website,
          normalized.company.name,
          normalized.address.city,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchable.includes(query);
        const matchesCity = filters.city
          ? normalized.address.city
              .toLowerCase()
              .includes(filters.city.toLowerCase())
          : true;
        const matchesCompany = filters.company
          ? normalized.company.name
              .toLowerCase()
              .includes(filters.company.toLowerCase())
          : true;

        return matchesSearch && matchesCity && matchesCompany;
      })
      .sort((first, second) => {
        const a = this.getSortValue(this.normalizeUser(first), sortField);
        const b = this.getSortValue(this.normalizeUser(second), sortField);
        const result = a.localeCompare(b, undefined, { sensitivity: "base" });
        return sortDirection === "asc" ? result : -result;
      });
  };

  getSortValue = (user, field) => {
    if (field === "company") return user.company.name;
    if (field === "city") return user.address.city;
    return user[field] || "";
  };

  handleSearch = (event) => {
    this.setState({ search: event.target.value, page: 1 });
  };

  handleFilterChange = (event) => {
    const { name, value } = event.target;

    this.setState((prevState) => ({
      filters: {
        ...prevState.filters,
        [name]: value,
      },
      page: 1,
    }));
  };

  clearFilters = () => {
    this.setState({
      filters: {
        city: "",
        company: "",
      },
      page: 1,
    });
  };

  handleSort = (field) => {
    this.setState((prevState) => ({
      sortField: field,
      sortDirection:
        prevState.sortField === field && prevState.sortDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  openAddModal = () => {
    this.setState({
      modalMode: "add",
      form: { ...emptyForm },
      formErrors: {},
      editingId: null,
      error: "",
      success: "",
    });
  };

  openEditModal = (user) => {
    const normalized = this.normalizeUser(user);

    this.setState({
      modalMode: "edit",
      editingId: normalized.id,
      form: {
        name: normalized.name,
        username: normalized.username,
        email: normalized.email,
        phone: normalized.phone,
        website: normalized.website,
        company: normalized.company.name,
        city: normalized.address.city,
      },
      formErrors: {},
      error: "",
      success: "",
    });
  };

  closeModal = () => {
    this.setState({
      modalMode: null,
      form: { ...emptyForm },
      formErrors: {},
      editingId: null,
      submitting: false,
    });
  };

  handleFormChange = (event) => {
    const { name, value } = event.target;

    this.setState((prevState) => ({
      form: {
        ...prevState.form,
        [name]: value,
      },
      formErrors: {
        ...prevState.formErrors,
        [name]: "",
      },
    }));
  };

  validateForm = () => {
    const { form } = this.state;
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.username.trim()) errors.username = "Username is required.";
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!form.phone.trim()) errors.phone = "Phone is required.";
    if (!form.company.trim()) errors.company = "Company is required.";
    if (!form.city.trim()) errors.city = "City is required.";

    this.setState({ formErrors: errors });
    return Object.keys(errors).length === 0;
  };

  submitForm = async (event) => {
    event.preventDefault();

    if (!this.validateForm()) return;

    const { form, modalMode, editingId } = this.state;
    const payload = {
      name: form.name,
      username: form.username,
      email: form.email,
      phone: form.phone,
      website: form.website,
      company: { name: form.company },
      address: { city: form.city },
    };

    this.setState({ submitting: true, error: "", success: "" });

    try {
      if (modalMode === "add") {
        const createdUser = await createUser(payload);
        this.setState((prevState) => ({
          users: [
            { ...payload, id: createdUser.id || Date.now() },
            ...prevState.users,
          ],
          success: "User added successfully.",
          submitting: false,
        }));
      } else {
        await updateUser(editingId, payload);
        this.setState((prevState) => ({
          users: prevState.users.map((user) =>
            user.id === editingId ? { ...payload, id: editingId } : user,
          ),
          success: "User updated successfully.",
          submitting: false,
        }));
      }

      this.closeModal();
    } catch (error) {
      this.setState({
        error: error.message,
        submitting: false,
      });
    }
  };

  confirmDelete = (user) => {
    this.setState({ deletingUser: user, error: "", success: "" });
  };

  cancelDelete = () => {
    this.setState({ deletingUser: null });
  };

  handleDelete = async () => {
    const { deletingUser } = this.state;
    if (!deletingUser) return;

    this.setState({ submitting: true });

    try {
      await deleteUser(deletingUser.id);
      this.setState((prevState) => ({
        users: prevState.users.filter((user) => user.id !== deletingUser.id),
        deletingUser: null,
        submitting: false,
        success: "User deleted successfully.",
      }));
    } catch (error) {
      this.setState({
        error: error.message,
        submitting: false,
      });
    }
  };

  changePage = (page) => {
    this.setState({ page });
  };

  changePageSize = (event) => {
    this.setState({
      pageSize: Number(event.target.value),
      page: 1,
    });
  };

  renderSortIcon(field) {
    const { sortField, sortDirection } = this.state;
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  renderModal() {
    const { modalMode, form, formErrors, submitting } = this.state;
    if (!modalMode) return null;

    return (
      <div className="modal-backdrop">
        <section className="modal" aria-modal="true" role="dialog">
          <div className="modal-header">
            <h2>{modalMode === "add" ? "Add User" : "Edit User"}</h2>
            <button
              className="icon-button"
              type="button"
              onClick={this.closeModal}
            >
              ×
            </button>
          </div>

          <form className="user-form" onSubmit={this.submitForm} noValidate>
            {[
              ["name", "Name"],
              ["username", "Username"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["website", "Website"],
              ["company", "Company"],
              ["city", "City"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  value={form[name]}
                  onChange={this.handleFormChange}
                  className={formErrors[name] ? "invalid" : ""}
                />
                {formErrors[name] && (
                  <span className="field-error">{formErrors[name]}</span>
                )}
              </label>
            ))}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={this.closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  renderDeleteDialog() {
    const { deletingUser, submitting } = this.state;
    if (!deletingUser) return null;

    return (
      <div className="modal-backdrop">
        <section className="modal small" aria-modal="true" role="dialog">
          <h2>Delete user?</h2>
          <p>
            This will remove <strong>{deletingUser.name}</strong> from the
            dashboard.
          </p>

          <div className="modal-actions">
            <button className="secondary-button" onClick={this.cancelDelete}>
              Cancel
            </button>
            <button
              className="danger-button"
              onClick={this.handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  render() {
    const {
      loading,
      error,
      success,
      search,
      filters,
      filtersOpen,
      page,
      pageSize,
    } = this.state;

    const preparedUsers = this.getPreparedUsers();
    const totalPages = Math.max(1, Math.ceil(preparedUsers.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visibleUsers = preparedUsers.slice(start, start + pageSize);

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Admin Console</p>
            <h1>User Management Dashboard</h1>
          </div>

          <button className="primary-button" onClick={this.openAddModal}>
            + Add User
          </button>
        </header>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <section className="toolbar">
          <input
            type="search"
            placeholder="Search by name, email, city, company..."
            value={search}
            onChange={this.handleSearch}
          />

          <button
            type="button"
            className="secondary-button"
            onClick={() => this.setState({ filtersOpen: !filtersOpen })}
          >
            Filters
          </button>
        </section>

        {filtersOpen && (
          <section className="filter-panel">
            <label>
              City
              <input
                name="city"
                value={filters.city}
                onChange={this.handleFilterChange}
              />
            </label>

            <label>
              Company
              <input
                name="company"
                value={filters.company}
                onChange={this.handleFilterChange}
              />
            </label>

            <button className="secondary-button" onClick={this.clearFilters}>
              Clear
            </button>
          </section>
        )}

        <section className="table-shell">
          {loading ? (
            <div className="empty-state">Loading users...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  {[
                    ["name", "Name"],
                    ["username", "Username"],
                    ["email", "Email"],
                    ["phone", "Phone"],
                    ["company", "Company"],
                    ["city", "City"],
                  ].map(([field, label]) => (
                    <th key={field}>
                      <button
                        type="button"
                        onClick={() => this.handleSort(field)}
                      >
                        {label} {this.renderSortIcon(field)}
                      </button>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => {
                    const normalized = this.normalizeUser(user);

                    return (
                      <tr key={normalized.id}>
                        <td>{normalized.name}</td>
                        <td>{normalized.username}</td>
                        <td>{normalized.email}</td>
                        <td>{normalized.phone}</td>
                        <td>{normalized.company.name}</td>
                        <td>{normalized.address.city}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="secondary-button"
                              onClick={() => this.openEditModal(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="danger-button"
                              onClick={() => this.confirmDelete(normalized)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </section>

        <footer className="pagination">
          <span>
            Showing {visibleUsers.length} of {preparedUsers.length} users
          </span>

          <label>
            Rows
            <select value={pageSize} onChange={this.changePageSize}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>

          <div className="page-buttons">
            <button
              className="secondary-button"
              disabled={currentPage === 1}
              onClick={() => this.changePage(currentPage - 1)}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="secondary-button"
              disabled={currentPage === totalPages}
              onClick={() => this.changePage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </footer>

        {this.renderModal()}
        {this.renderDeleteDialog()}
      </div>
    );
  }
}

export default UserDashboard;

// Fetch and populate roles
async function fetchRoles() {
    try {
        const response = await fetch('/roles');
        const roles = await response.json();
        return roles;
    } catch (error) {
        return [];
    }
}

// Fetch and populate users
async function fetchUsers(page = 1, search = '', role = '') {
    try {
        const response = await fetch(`/users?page=${page}&search=${encodeURIComponent(search)}&role=${role}`);
        const data = await response.json();
        return data;
    } catch (error) {
        return { users: [], page: 1, pages: 1 };
    }
}

// Create or update user
async function saveUser(userId, data) {
    const url = userId ? `/users/${userId}` : '/users';
    const method = userId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            return result;
        } else {
            return result; // Return the error result to show in the toast
        }
    } catch (error) {
        return { error: 'Network error' }; // Return a network error to show in the toast
    }
}

// Fetch user details
async function fetchUserDetails(userId) {
    try {
        const response = await fetch(`/users/${userId}`);
        const user = await response.json();
        return user;
    } catch (error) {
        return null;
    }
}


// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
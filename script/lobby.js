const joinRoom = (e) => {
    e.preventDefault();

    const inviteCode = e.target.invite_link.value.trim();
    window.location = `index.html?room=${inviteCode}`;
}

const joinForm = document.getElementById("join-form");

joinForm.addEventListener('submit', joinRoom);


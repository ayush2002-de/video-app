const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const generateUid = () => {
	const timestamp = new Date().getTime();
	const random = Math.floor(Math.random() * 1000000);
	return timestamp + '-' + random;
};

const getRoomId = () => {
    const roomId = urlParams.get('room')
    if(!roomId) {
        window.location = 'lobby.html';
    }

    return roomId;

}

const APP_ID = 'cd8ea602b9ea43d5bdecbcca8eef71b3';
const token = null;

let localStream;
let remoteStream;
let peerConnection;
let client;
let channel;

const servers = {
	iceServers: [
		{
			urls: [
				'stun:stun1.l.google.com:19302',
				'stun:stun2.l.google.com:19302',
			],
		},
	],
};

const mediaConstraint = {
	video: {
		height: { min: 480, ideal: 1080, max: 1080 },
		width: { min: 640, ideal: 1920, max: 1920 },
	},
	audio: true,
};

const uid = generateUid();
const roomId = getRoomId();

const init = async () => {
	client = await AgoraRTM.createInstance(APP_ID);
	await client.login({ uid, token });

	channel = client.createChannel(roomId);
	await channel.join();

	channel.on('MemberJoined', handelUserJoined);
	channel.on('MemberLeft', handelUserLeft);

	client.on('MessageFromPeer', handelMessageFromPeer);

	localStream = await navigator.mediaDevices.getUserMedia(mediaConstraint);
	document.getElementById('user-1').srcObject = localStream;
};

const handelMessageFromPeer = async (message, MemberId) => {
	message = JSON.parse(message.text);
	if (message.type === 'offer') {
		createAnswer(MemberId, message.offer);
	}
	if (message.type === 'answer') {
		addAnswer(message.answer);
	}
	if (message.type === 'candidate') {
		if (peerConnection) {
			peerConnection.addIceCandidate(message.candidate);
		}
	}
};

const handelUserJoined = async (MemberId) => {
	createOffer(MemberId);
};

const handelUserLeft = async (MemberId) => {
	document.getElementById('user-2').style.display = 'none';
	document.getElementById('user-1').classList.remove('smallFrame');
};

const createPeerConnection = async (MemberId) => {
	peerConnection = new RTCPeerConnection(servers);

	remoteStream = new MediaStream();
	document.getElementById('user-2').srcObject = remoteStream;
	document.getElementById('user-2').style.display = 'block';

	document.getElementById('user-1').classList.add('smallFrame');

	if (!localStream) {
		localStream = await navigator.mediaDevices.getUserMedia(
			mediaConstraint
		);
		document.getElementById('user-1').srcObject = localStream;
	}

	localStream.getTracks().forEach((track) => {
		peerConnection.addTrack(track, localStream);
	});

	peerConnection.ontrack = (event) => {
		event.streams[0].getTracks().forEach((track) => {
			remoteStream.addTrack(track);
		});
	};

	peerConnection.onicecandidate = async (event) => {
		if (event.candidate) {
			client.sendMessageToPeer(
				{
					text: JSON.stringify({
						type: 'candidate',
						candidate: event.candidate,
					}),
				},
				MemberId
			);
		}
	};
};

const createOffer = async (MemberId) => {
	await createPeerConnection(MemberId);
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);

	client.sendMessageToPeer(
		{ text: JSON.stringify({ type: 'offer', offer: offer }) },
		MemberId
	);
};

const createAnswer = async (MemberId, offer) => {
	await createPeerConnection();
	await peerConnection.setRemoteDescription(offer);

	const answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answer);

	client.sendMessageToPeer(
		{ text: JSON.stringify({ type: 'answer', answer: answer }) },
		MemberId
	);
};

const addAnswer = async (answer) => {
	if (!peerConnection.currentRemoteDescription) {
		peerConnection.setRemoteDescription(answer);
	}
};

const leaveChannel = async () => {
	await channel.leave();
	await client.lgout();
};

const toggleMedia = async (mediaTool) => {
	const mediaTrack = localStream
		.getTracks()
		.find((track) => track.kind === mediaTool);

	if (mediaTrack.enabled) {
		mediaTrack.enabled = false;
		document.getElementById(`${mediaTool}-btn`).style.backgroundColor =
			'rgb(255,80,80,1)';
	} else {
		mediaTrack.enabled = true;
		document.getElementById(`${mediaTool}-btn`).style.backgroundColor =
			'rgb(179, 102, 249, .9)';
	}
};

window.addEventListener('unload', leaveChannel);
document
	.getElementById('video-btn')
	.addEventListener('click', toggleMedia.bind(null, 'video'));
document
	.getElementById('audio-btn')
	.addEventListener('click', toggleMedia.bind(null, 'audio'));

init();

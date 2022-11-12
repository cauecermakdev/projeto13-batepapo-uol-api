
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';
import joi from 'joi';

dotenv.config();


const mongoClient = new MongoClient(process.env.MONGO_URI);
//entre banco de dados, nao na net

await mongoClient.connect();
const dbUol = mongoClient.db("bd_batepapo_uol")


const app = express();
app.use(express.json());
app.use(cors());

/* {name: 'xxx', lastStatus: Date.now()} */
const participantSchema = joi.object({
	name: joi.string().required()
	/* lastStatus: joi.number().required()//uncertain */
});


/* {from: 'xxx', to: 'Todos', text: 'entra na sala...', type: 'status', time: 'HH:MM:SS'} */
const messageSchema = joi.object({
	to: joi.string().required(),
	text: joi.string().required(),
	type: joi.string().required()
});

app.post('/participants', async (req, res) => {
	const participantes = req.body;
	console.log("participantes", participantes);

	const validation = participantSchema.validate(participantes, { abortEarly: true });

	if (validation.error) {
		res.sendStatus(422);
		return
	}

	try {
		await dbUol.collection('participants').insertOne({ ...participantes, lastStatus: Date.now() })
		res.sendStatus(201);
	} catch (error) {
		console.error(error);
		res.sendStatus(500);
	}
});


app.get('/participants', async (req, res) => {
	try {
		const participantsCollection = dbUol.collection("participants");
		const participantList = await participantsCollection.find({}).toArray();

		res.send(participantList)
	} catch (error) {
		res.status(500).send('Deu erro na requisicao dos participantes')
	}
});

app.post('/messages', async (req, res) => {
	const user = req.headers.user;
	console.log(">>>>>user from req is", user);
	const message = req.body;
	let now_date = dayjs().format("HH:mm:ss");

	console.log("****************")
	console.log("MESSAGE POST")
	console.log("now_date", now_date);
	console.log("message req.body", message);
	console.log("****************")

	const validation = messageSchema.validate(message, { abortEarly: true });

	if (validation.error) {
		res.status(422).send("DEu erro no post da message");
		return
	}

	try {
		const isUser = await dbUol.collection('messages').findOne({ from: user });
		console.log("********Is User", isUser);
		await dbUol.collection('messages').insertOne({ ...message, from: user, time: now_date })
		res.sendStatus(201);
	} catch (error) {
		console.error(error);
		res.sendStatus(500);
	}
});

app.get('/messages', async (req, res) => {

	try {
		const messageCollection = dbUol.collection("messages");
		const messagesList = await messageCollection.find({}).toArray();

		res.send(messagesList)
	} catch (error) {
		res.status(500).send('Deu erro na requisicao das mensagens')
	}
});

app.post('/status', async (req, res) => {
	const user = req.headers.user;
	console.log("****************************")
	console.log("USER STATUS", user);
	console.log("****************************")
	const status = req.body;




	/* const validation = messageSchema.validate(message, { abortEarly: true });  */
	/* 
		if (validation.error) {
			res.status(422).send("DEu erro no post da message");
			return
		}  */

	try {
		const isUser = await dbUol.collection('participants').findOne({ name: user });
		console.log("********Is User na rota /status", isUser);
		console.log("********Is User _ID", isUser._id);
		const statusUpdate_newobj = { ...isUser, lastStatus: Date.now() };

		//teoria update é melhor. acho que assim vai escrever mais uma vez...
		/* await dbUol.collection('participants').insertOne({ ...isUser, lastStatus: Date.now() }) */

		/* 	const body = {...isUser,lastStatus: Date.now()};*/
		await dbUol.collection('participants').updateOne({ _id: ObjectId(isUser._id) }, { $set: statusUpdate_newobj });
		/* await dbUol.collection('participants').updateOne({ _id: ObjectId(isUser._id)}, {$set: lastStatus: Date.now() });  */


		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		res.sendStatus(404);
	}
});

async function deleteUser(participantUser){
	const messageLogout = {
		from: participantUser.name,
		to: 'Todos',
		text: 'sai da sala...',
		type: 'status',
		time: dayjs().format("HH:mm:ss")
	}

	try{
		await dbUol.collection("participants").deleteOne({_id: ObjectId(participantUser._id) })
		await dbUol.collection("messages").insertOne(messageLogout);

	}
	catch(err){
		console.error(error);
		res.sendStatus(201);
		/* res.sendStatus(404); */
	}
}

function isOnline(participantUser){
	console.log("entrou isOnline");
	const timeOff = (participantUser.lastStatus - Date().now);
	if(timeOff > 15000){
		deleteUser(participantUser);
	}else{
		return true;
	}
}

//removendo a cada 15 segundo participants inativos
async function removeParticipantsOffline() {
	const allParticipants = await dbUol.collection('particpants').find({}).toArray();
	const allParticipantsOnline = allParticipants.filter((participantUser) => isOnline(participantUser))
};


setInterval(removeParticipantsOffline, 15000); 


app.listen(5000, () => {
	console.log('Server is listening on port 5000.');
});


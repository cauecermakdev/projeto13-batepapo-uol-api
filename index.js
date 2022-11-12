import express from 'express'
import cors from 'cors'
import {MongoClient } from "mongodb";

app.use();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient("mongodb://localhost:27017"); 
//entre banco de dados, nao na net
let db;

mongoClient.connect().then(()=>{
	db =  mongoClient.db("nomeBD");
})
.catch((err)=>{console.log(err)});

app.get("/herois", (req,res)=>{
	db.collectionName("herois")
		.find()
		.toArray()//do mongodb pra tornar os dados mais traalhaeisgg:G
		.then((herois)=>{
			/*console.log(herois)*/
			res.send(herois);
	}).catch(err=>{
		console.log(err);
		res.sendStatus(500);
	})
})

const objeto ={
	nome:"caue",
	idade:"28",
	nusp:"8936864"
}

app.post("/herois",(req,res)=>{
	db.collection("herois")
		.insert({
			objeto
		})
	.then((response)=>{
		res.status(201).send("criada com sucesso")
	}).catch((err)=>{
		console.log(err);
	})
})

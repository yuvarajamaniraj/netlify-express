const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql");
var nodemailer = require('nodemailer');

const app = express();
const cors = require('cors');
app.use(cors({origin: 'null'}));
const otpGen = () => {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++ ) {
      OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

const db = mysql.createConnection({
  user: "sql5473021",
  host: "sql5.freesqldatabase.com",
  password: "rvx9vEWTW6",
  database: "sql5473021",
  port: "3306",
});

router.post("/.netlify/functions/api/register", (req, res) => {
  const { email, password } = req.body;
  const verified = false;
  const otp = '';
  db.query(`SELECT EXISTS(SELECT * FROM users WHERE email='${email}')`,
  (err, result) => {
    if (err){
      throw err;
    }
    else{
      result = JSON.parse(JSON.stringify(result));
      // res.send(result)
      var val;
      for (var key in result) {
        val = result[key];
        result = val;
        for(key in result){
          val = result[key];
        }
      if(val === 0){
        db.query("INSERT INTO users (email, password, verified, otp) VALUES (?,?,?,?)",
        [email, password, verified, otp],
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send({user: "created"});
          }
        })
      }
      else {
        res.send({userExists: 1})
      }
    }
  }
  });
});

router.post("/.netlify/functions/api/verifyOtp", (req, res) => {
const { email, otp } = req.body;
const verified = false;
// console.log(otp);

db.query(`UPDATE users SET verified=${true}, otp='' WHERE email='${email}' and otp='${otp}'`,
(err, result) => {
  if(err) {
    console.log("wrong otp");
  }
  else{
    db.query(`SELECT verified FROM users WHERE email='${email}'`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        result = JSON.parse(JSON.stringify(result))
        res.send(result);
      }
    })
  }
});
});

router.post(("/.netlify/functions/api/mail"),async (req,res)=>{
const tomail=req.body.tomail
let localPart = tomail.split('@');
const newOtp = otpGen(); 
var transporter = nodemailer.createTransport({
  service: 'Gmail',

  auth: {
    user: 'websitefeedback.codestrix@gmail.com',
    pass: 'CodeStrix@123',
  }
});

var mailOptions = {
  from: process.env.FromMail,
  to: tomail,
  subject: 'Verification for Codestrix account',
  text: `your OTP for Verification is ${newOtp}`       
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    res.json({
      error: error,
      msg: 'fail'
    });
  } 
  else{
    db.query(`UPDATE users SET otp=${newOtp} WHERE email='${tomail}'`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("otp stored");
      }
    })
    res.json({
      msg: 'success'
    })
  }
});

})


router.post("/.netlify/functions/api/login", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { email, password } = req.body;
  const resResult = "";
  db.query(`SELECT EXISTS(SELECT * FROM users WHERE email='${email}')`,
  (err, result)=>{
    if(err){
      console.log(err);
    }
    else{
      result = JSON.parse(JSON.stringify(result));
      // console.log(result)
      // res.send(result)
      var val;
      for (var key in result) {
        val = result[key];
        result = val;
        for(key in result){
          val = result[key];
        }
      if(val === 1){
        db.query(`SELECT verified FROM users WHERE email='${email}' and password='${password}'`,
        (err, result)=>{
          if(err){
            console.log(err);
          }
          else{
            result = JSON.parse(JSON.stringify(result));
            res.send(result)
          }
        })
      }
      else {
        res.send({user: "email does not exists"})
      }
    }
    // console.log(val)
    }
  })
  
});

app.get("/.netlify/functions/api/", (req, res) => {
  res.json({
    Responses: "Api connection works properly!"
  });
});


// app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);

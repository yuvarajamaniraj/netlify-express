const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2");
var nodemailer = require('nodemailer');

const app = express();
const cors = require('cors');
app.use(cors());
app.options('*', cors());
const router = express.Router();

const otpGen = () => {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++ ) {
      OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'remotemysql.com',
  port            :  3306,
  user            : 'y39M6kKqGw',
  password        : '4AfOXy87oS',
  database        : 'y39M6kKqGw',
});

router.get("/check_db_con", (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': "Authorization, Content-Type"
  });
  pool.getConnection((err, conn) => {
    if (err) {
      res.send("error getting connection");
    }
    else {
      // res.send(result)
      conn.query('SELECT email FROM users',
        (err, result) => {
          if (err) {
            res.json({ db_error: err });
          }
          else {
            res.status(200).json(result);
          }
        });
    }
    conn.release()
  })
});
router.get("/check_db_qr_con", (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': "Authorization, Content-Type"
  });
  pool.getConnection((err, conn) => {
    if (err) {
      res.send("error getting connection");
    }
    else {
      // res.send(result)
      conn.query('SELECT phone FROM qrusers',
        (err, result) => {
          if (err) {
            res.json({ db_error: err });
          }
          else {
            res.status(200).json(result);
          }
        });
    }
    conn.release()
  })
});

router.post("/check_post_req", (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': "*",
  })
//   const { email, password } = JSON.parse(req.body);
  res.send(JSON.parse(JSON.stringify(req.body)));
//   pool.getConnection(function (err, conn) {
//     if (err) res.send(err);
//     else {
//       // res.send(str)
//       conn.query('SELECT EXISTS (SELECT * FROM `users` WHERE `email` = ?)',
//         [email],
//         (err, result) => {
//           if (err) {
//             throw err;
//           }
//         else {
//             result = JSON.parse(JSON.stringify(result));
//             res.send(result)
//           }
//         });
//     }
    conn.release()
  });
});

router.post("/register", (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': "*",
  })
  const { email, password } = JSON.parse(req.body);
  // const values = JSON.parse(req.body)
  const verified = false;
  const otp = '';
  // res.send(email)
  pool.getConnection(function (err, conn) {
    if (err) res.send(err);
    else {
      // res.send(str)
      conn.query('SELECT EXISTS (SELECT * FROM `users` WHERE `email` = ?)',
        [email],
        (err, result) => {
          if (err) {
            throw err;
          }
          else {
            // result = JSON.parse(JSON.stringify(result));
            // res.send(result)
            var val;
            for (var key in result) {
              val = result[key];
              result = val;
              for (key in result) {
                val = result[key];
              }
            
            // res.send({ value : val });
              if (val === 0) {
                conn.query('INSERT INTO `users` (`email`, `password`, `verified`, `otp`) VALUES (?,?,?,?)',
                  [email, password, verified, otp],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                    } else {
                      res.status(200).send({ user: "created" });
                    }
                  })
              }
              else {
                res.status(200).send({ userExists: 1 })
              }
            }
          }
        });
    }
    conn.release()
  });
});
router.post("/verifyOtp", (req, res) => {
  const { email, otp } = JSON.parse(req.body);
  const verified = false;
  // console.log(otp);
  pool.getConnection(function (err, conn) {
    if (err) res.send(err);
    else {
      conn.query('UPDATE `users` SET `verified` = ?, `otp` = ? WHERE `email` = ? and `otp` = ?',[true,'',email,otp],
        (err, result) => {
          if (err) {
            console.log("wrong otp");
          }
          else {
            conn.query('SELECT `verified` FROM `users` WHERE `email` = ?',[email],
              (err, result) => {
                if (err) {
                  console.log(err);
                } else {
                  result = JSON.parse(JSON.stringify(result))
                  res.status(200).json(result);
                }
              })
          }
        });
    }
  });
  // res.send(req.body)
})

router.post(("/mail"), (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': "*",
  })
  const { tomail } = JSON.parse(req.body)
  const newOtp = otpGen();
  // res.send({email: tomail, OTP: newOtp})  
  var transporter = nodemailer.createTransport({
    service: 'Gmail',

    auth: {
      user: 'websitefeedback.codestrix@gmail.com',
      pass: 'CodeStrix@123',
    }
  });

  var mailOptions = {
    from: 'websitefeedback.codestrix@gmail.com',
    to: tomail,
    subject: 'Verification for Codestrix account',
    text: `your OTP for Verification is ${newOtp}`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      res.json({
        error: error,
        msg: 'fail'
      });
    }
    else {
      pool.getConnection(function (err, conn) {
        if (err) res.send(err);
        else {
          conn.query('UPDATE `users` SET `otp` = ? WHERE `email`= ?', [newOtp, tomail],
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
    }

  })
})


router.post("/login", (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': "*",
  })
  const { email, password } = JSON.parse(req.body);
  const resResult = "";
  pool.getConnection(function (err, conn) {
    if (err) res.send(err);
    else {
      conn.query('SELECT EXISTS(SELECT * FROM `users` WHERE `email` = ?)',[email],
        (err, result) => {
          if (err) {
            console.log(err);
          }
          else {
            result = JSON.parse(JSON.stringify(result));
            // console.log(result)
            // res.send(result)
            var val;
            for (var key in result) {
              val = result[key];
              result = val;
              for (key in result) {
                val = result[key];
              }
              if (val === 1) {
                conn.query('SELECT `verified` FROM `users` WHERE `email` = ? and `password` = ?',[email,password],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      result = JSON.parse(JSON.stringify(result));
                      res.json(result)
                    }
                  })
              }
              else {
                res.json({ user: "email does not exists" })
              }
              // res.send(req.body)
            }
            console.log(val)
          }
        })
    }
  })
  
});

router.get("/", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    Responses: "Api connection works properly!"
  });
});

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);

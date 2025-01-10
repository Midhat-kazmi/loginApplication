import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js'
import otpGenerator from 'otp-generator';



/** middleware for verify user */
export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method == "GET" ? req.query : req.body;

    // check the user existance
    let exist = await UserModel.findOne({ username });
    if (!exist) return res.status(404).send({ error: "Can't find User!" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

/** POST: http://localhost:8080/api/register 
                           * @param : `{
                            "username" : "example123",
                            "password" : "admin123",
                            "email": "example@gmail.com",
                            "firstName" : "bill",
                            "lastName": "william",
                            "mobile": 8009860560,
                            "address" : "Apt. 556, Kulas Light, Gwenborough",
                            "profile": ""
                          }`
// */
// 
// import UserModel from './models/UserModel'; // Adjust the import path as needed

export async function register(req, res) {
  try {
    //
    const { username, password, profile, email } = req.body;

    // Check if username already exists
    const existingUsername = await UserModel.findOne({ username }); // checking in databsse through model using mongoose,
    // // which makes request to mongodb
    if (existingUsername) {
      return res.status(400).send({ error: "Please use a unique username" });
    }

    // Check if email already exists
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).send({ error: "Please use a unique email" });
    }

    // Hash the password and create the user
    if (password) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({
          username,
          password: hashedPassword, // we use hash password so if database gets hacked no one knows what the password is
          profile,
          email,
        });

        const result = await user.save(); // saving to database ( mongo) using model through mongoose
        return res
          .status(201) // created
          .send({ msg: "User registered successfully", result });
      } catch (hashError) {
        return res.status(500).send({ error: "Unable to hash the password" });
      }
    } else {
      return res.status(400).send({ error: "Password is required" });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ error: error.message || "An error occurred" });
  }
}

/** POST: http://localhost:8080/api/login
 * @param : {
  "username" : "example123",
  "password" : "admin123"
}
  */

export async function login(req, res) {
  const { username, password } = req.body;
  try {
    //table main - find kro one -  user with what  {username }
    UserModel.findOne({ username })
      .then((user) => {
        // phr user ko pass kro neechay function main
        bcrypt
          .compare(password, user.password)

          .then(function (passwordCheck) {
            if (passwordCheck === false)
              // agr to false hai
              //
              return res
                .status(400)
                .send({ error: "typed password is incorrect or empty" });
            // create jwt token
            const token = jwt.sign(
              {
                userId: user._id,
                username: user.username,
              },
              ENV.JWT_SECRET,
              { expiresIn: "24h" }
            );

            return res.status(200).send({
              msg: "Login Successful...!",
              username: user.username,
              token,
            });
          })

          .catch((error) => {
            return res.status(400).send({ error: "Password does not match" });
          });
      })
      .catch((error) => {
        return res.status(404).send({ error: "Username not found" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
}

// export async function login(req, res) {
//   const { username, password } = req.body;

//   try {
//     // Find the user by username
//     const user = await UserModel.findOne({ username });
//     if (!user) {
//       return res.status(404).send({ error: "Username not found" });
//     }

//     // Compare the plain-text password with the hashed password
//     const passwordCheck = await bcrypt.compare(password, user.password);

//     if (!passwordCheck) {
//       return res.status(400).send({ error: "Password does not match" });
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         username: user.username,
//       },
//       ENV.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     // Send success response
//     return res.status(200).send({
//       msg: "Login Successful...!",
//       username: user.username,
//       token,
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .send({ error: error.message || "An error occurred" });
//   }
// }

/**GET: http://localhost:5000/api/user/example123 */

export async function getUser(req, res) {
  //get user aik function (API endpoint:  URL where your server listens for requests from clients)
  //  hai jo retrieves a user from the database to
  const { username } = req.params; //req.params contains route parameters,For example, if the URL is /user/example123, req.params.username will be example123.
  //username: Extracted from reqparams.

  try {
    if (!username) return res.status(501).send({ error: "Invalid Username" });

    // need it's comments added
    //new code
    // try {
    //   var user = await UserModel.findOne({ username });
    // }
    // catch (dberror) {
    //   return res.status(500).send({ dberror });
    // }

    // if (!user) return res.status(501).send({ error: "Couldn't Find the User" });

    // /** remove password from user */
    // // mongoose return unnecessary data with object so convert it into json
    // const { password, ...rest } = Object.assign({}, user.toJSON());

    // return res.status(200).send(rest);

    // //old code
    UserModel.findOne({ username }).then(function (user, err) {
      //usermodel.findone to find a user in the database with the given username

      if (err) return res.status(500).send({ err });

      if (!user)
        return res.status(501).send({ error: "Couldn't Find the User" });

      /** remove password from user */
      // mongoose return unnecessary data with object so convert it into json
      const { password, ...rest } = Object.assign({}, user.toJSON());

      return res.status(200).send(rest);
    });
  } catch (error) {
    return res.status(404).send({ error: "Cannot Find User Data" });
  }
}

/** PUT: http://localhost:8080/api/updateuser 
* @param:{
    "id": "<userid>"
}
    body:{
    firstName:'',
    address: '',
    profile:''
    }
*/

export async function updateUser(req, res) {
  try {
    // const id = req.query.id;
    const { userId } = req.user;

    if (userId) {
      const body = req.body;
      // new code
   
     //  
      // update the data
     
     
      UserModel.updateOne({ _id: userId }, body, function (err, data) {
        if (err) throw err;

        return res.status(201).send({ msg: "Record Updated...!" });
      });
    } else {
      return res.status(401).send({ error: "User Not Found...!" });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

/**GET: http://localhost:8080/api/generateOTP */

export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
}

/**GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).send({ msg: "Verify Successsfully!" });
  }
  return res.status(400).send({ error: "Invalid OTP" });
}

// successfully redirect user when OTP is valid
/**GET: http://localhost:8080/api/createResetSession*/
export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    return res.status(201).send({ flag: req.app.locals.resetSession });
  }
  return res.status(440).send({ error: "Session expired!" });
}

//PUT : http://localhost:8080/api/resetPassword
export async function resetPassword(req, res) {
  try {
    if (!req.app.locals.resetSession)
      return res.status(440).send({ error: "Session expired!" });

    const { username, password } = req.body;

    try {
      UserModel.findOne({ username })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              UserModel.updateOne(
                { username: user.username },
                { password: hashedPassword },
                function (err, data) {
                  if (err) throw err;
                  req.app.locals.resetSession = false; // reset session
                  return res.status(201).send({ msg: "Record Updated...!" });
                }
              );
            })
            .catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not Found" });
        });
    } catch (error) {
      return res.status(500).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

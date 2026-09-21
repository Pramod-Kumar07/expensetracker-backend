const prisma = require("../../config/db");
const bcrypt = require("bcrypt")

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Name, email or password is missing.",
      });
    }

    const existingUser = await prisma.user.findUnique({
        where:{
            email
        }
    })
    if(existingUser){
        return res.status(400).json({
            status:400,
            message: "User already exists."
        })
    }

    const hashPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data:{
            name,
            email,
            password:hashPassword
        },
        select:{
            id:true, 
            name:true, 
            email:true, 
            createdAt:true
        }
    })

    return res.status(201).json({
        staus:201,
        message: "User added successfully.",
        data: user
    })
  } catch (err) {
    return res.status(400).json({
      staus: 400,
      message: err.message || "Something went wrong!",
    });
  }
};

module.exports = { register };

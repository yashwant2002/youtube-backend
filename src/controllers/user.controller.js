import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User} from "../models/user.model.js"
import { uploadCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res)=>{
        // get user details from frontend
        
        const {fullName, email, username, password } = req.body
        // console.log('fullName:', fullName);

        // validation - not empty
        if([fullName, email, username, password].some((field)=> field?.trim()=== " ")){
            throw new ApiError(400, 'All field are required')
        }
        // check if user already exists: username, email
        const existUser = await User.findOne({$or: [{username}, {email}]})

        if (existUser) {
            throw new ApiError(400, "User with email or username is already exists")
        }
        // check for images, check for avatar
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.field?.coverImage[0]?.path;
        
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required")
        }
        // upload them to cloudinary, avatar
        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
        }
        const avatar = await  uploadCloudinary(avatarLocalPath);
        const coverImage = await uploadCloudinary(coverImageLocalPath);
        
        if(!avatar){
            throw new ApiError(400, "Avatar file  is required")
        }
        // create user object - create entry in db
        const user = await User.create({
            fullName,
            email,
            password,
            avatar : avatar.url,
            coverImage : coverImage.url,
            username : username.toLowerCase()
        })

        // remove password and refresh token field from response

        const createUser = await User.findById(user._id).select("-password  -refreshToken")

        // check for user creation
        if (!createUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        // return res 

        return res.status(201).json(
            new ApiResponse(200, createUser, "User register successfully")
        )
})


export {
    registerUser,
}   
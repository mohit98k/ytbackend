

this is my personal note space:-

(///////////////////////////////////////////////////////////////////////////////////////////////////////////////)

1."type": "commonjs" → you must use require / module.exports

    if exporting a single function no need to use curly braces while importing 
    if exporting multiple functions we need to use curly braces while importing 

2."type": "module" → you must use import / default export or named export  

    example is in the user.model.js 

3.if the index.js is inside src , modify script : "dev": "nodemon src/index.js" and to start the server npm run dev

4.if you modify the .env, nodemon wont capture and apply the change ,you need to manually restart the server 

5.fs is Node.js’s built-in file system module. We use it in your project to delete the local file once it has been uploaded to Cloudinary.

 functions :
        Read files

        Write files

        Delete files

        Create folders

        Check if a file exists, etc.

6.how ref and access token works 

        You log in → server sends access token + refresh token.

        You use access token to access protected resources.

        When access token expires → you use refresh token to get a new access token.

        If the refresh token expires, you must log in again.

7.Always send structured JSON { success, message, data } so the frontend knows what’s happening.

        json({
            success: true,
            message: "User fetched successfully",
            user: req.user,   // this is attached by verifyJWT middleware
        })

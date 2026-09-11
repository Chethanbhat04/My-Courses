
// JSX rules — Convert this invalid JSX to valid JSX, explaining each fix:

// <div class="box">
//   <label for="name">Name</label>
//   <input type="text" id="name">
//   <p>Hello <script>alert('hi')</script></p>
// </div>

function Exercise1() {
    return (
        <>
            <div className="box">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" />
                <p>Hello</p>
            </div>
        </>
    );
}

export default Exercise1;
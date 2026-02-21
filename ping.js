async function ping() {
    try {
        const res = await fetch('http://localhost:3000/api/saves', {
            headers: {
                'Cookie': 'next-auth.session-token=123'
            }
        });
        const text = await res.text();
        console.log(text);
    } catch (err) {
        console.error(err);
    }
}

ping();

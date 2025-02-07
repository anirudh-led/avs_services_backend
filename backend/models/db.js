const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create a Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// Function to register a new user
const registerUser = async (username, password, salary = 0, balance = 0) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('users').insert([
            { username, password: hashedPassword, salary, balance }
        ]).select('id').single();
        if (error) throw error;
        return data.id;
    } catch (err) {
        throw err;
    }
};

const getUserById = async (userId) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(); // Ensures only one user is returned

    if (error) {
        console.error('Error fetching user:', error);
        throw error;
    }

    return data;
};


// Authenticate user (login)
const authenticateUser = async (username, password) => {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
        if (error || !data) return null;
        const isMatch = await bcrypt.compare(password, data.password);
        return isMatch ? data : null;
    } catch (err) {
        throw err;
    }
};


const deleteUser = async (userId) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
        return { success: true };
    } catch (err) {
        throw err;
    }
};

// Get all workers
const getWorkers = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data;
    } catch (err) {
        throw err;
    }
};

// Pay a worker by updating their balance
const payWorker = async (workerId, amount) => {
    const { data, error } = await supabase.rpc('pay_worker', { worker_id: workerId, amount });
    if (error) throw error;
    return { success: true };
};




// Export the database functions
module.exports = {
    registerUser,
    authenticateUser,
    getWorkers,
    payWorker,
    deleteUser,
    getUserById
};

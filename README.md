# QueueLess — Smart Queue Management System

> Book a token online. Track your place in line live. Skip the crowded waiting room.

QueueLess is a real-time queue management web app for clinics, hospitals, salons and service centres. Customers book a token from their phone and watch their position and estimated wait update live. Staff run the queue from an admin dashboard (Call Next / Complete / Skip), and every change appears instantly on the customer's screen via Socket.IO.


## 1. Problem

- People waiting for a clinic, salon or service centre don't know how many people are ahead of them.
- They don't know when their turn will come, so they sit in crowded waiting areas.
- Staff manage the queue manually (paper slips, shouting names).

## 2. Solution

- Customer picks a service, enters name and phone, and gets a **unique token**.
- Customer sees **live**: the token being served now, people ahead, estimated wait.
- Admin sees the live queue and controls it with one-click actions.
- All state lives on the **backend/database**. The frontend never fakes or manually edits queue numbers.


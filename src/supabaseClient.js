// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'




// 실제 주소가 없으므로 에러가 나지 않게 형식만 맞춰둡니다.
const dummyUrl = 'https://temp.supabase.co'
const dummyKey = 'eyJhbGciOiJIUzI1Ni...'

export const supabase = createClient(dummyUrl, dummyKey)
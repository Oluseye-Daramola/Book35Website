
// This is to show all component posible states on a page.


import { useState } from 'react';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {Card} from '../components/Card';
import {Header} from '../components/Header';
import {TimeSlot} from '../components/TimeSlot';




export const DesignDemo=()=>{
  
  const [email, setEmail] = useState('');
  
  const [selected, setSelected] = useState('Mon 9:30');



  
  return (
    
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>

      
      <Header title="Design System Demo" subtitle="Every component, every state" />

      
      <h2 style={{ marginTop: 32 }}>
        Buttons
      </h2>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        
        <Button variant="primary">Primary</Button>
        
        <Button variant="accent">Accent</Button>
        
        <Button variant="secondary">Secondary</Button>
        
        <Button disabled>Disabled</Button>
        
      </div>
      

      <h2 style={{ marginTop: 32 }}>
        Inputs
      </h2>
      
      <Card>
        
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <Input label="With error" value="" onChange={() => {}} error="This field is required" />
        
        <Input label="Purpose" multiline placeholder="What's this for?" value="" onChange={() => {}} />
        
        <p className="text-caption">
          You typed: {email || '(nothing yet)'}
        </p>
        
      </Card>

      

      <h2 style={{ marginTop: 32 }}>
        Time slots
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 }}>
        
        {['Mon 9:00', 'Mon 9:30', 'Tue 10:00'].map((t) => (
      
          <TimeSlot key={t} time={t} selected={selected === t} onClick={() => setSelected(t)} />
        ))}
        
        <TimeSlot time="Wed 14:00" status="booked" />
        
      </div>

      <h2 style={{ marginTop: 32 }}>
        Typography
      </h2>
      
      <p className="text-display">
        Display 32/40
      </p>
      
      <h1>H1 24/32</h1>
      
      <h2>H2 18/26</h2>
      
      <p>Body 15/24</p>
      
      <p className="text-label">
        Label 13 medium
      </p>
      
      <p className="text-caption">
        Caption 12
      </p>

      
    </div>
  );
}

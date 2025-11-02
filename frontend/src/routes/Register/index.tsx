import { Routes, Route, Navigate } from 'react-router-dom';
import { Rules } from './Rules';
import { Auth } from './Auth';
import { Account } from './Account';
import { Photos } from './Photos';
import { Info } from './Info';
import { StepSkills } from './StepSkills';
import { StepInterests } from './StepInterests';
import { Location } from './Location';
import { StepSummary } from './StepSummary';

export const Register = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="rules" replace />} />
      <Route path="rules" element={<Rules />} />
      <Route path="auth" element={<Auth />} />
      <Route path="account" element={<Account />} />
      <Route path="photos" element={<Photos />} />
      <Route path="info" element={<Info />} />
      <Route path="skills" element={<StepSkills />} />
      <Route path="interests" element={<StepInterests />} />
      <Route path="location" element={<Location />} />
      <Route path="summary" element={<StepSummary />} />
    </Routes>
  );
};

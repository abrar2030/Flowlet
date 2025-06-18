import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload, 
  Camera, 
  FileText, 
  Shield, 
  User, 
  MapPin,
  Calendar,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { useAuth, useFormValidation } from '../../hooks/index.js';
import { useUIStore } from '../../store/index.js';
import { kycAPI } from '../../services/api.js';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useUIStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState({});

  const steps = [
    { id: 'welcome', title: 'Welcome', description: 'Let\'s get you started' },
    { id: 'personal', title: 'Personal Info', description: 'Tell us about yourself' },
    { id: 'address', title: 'Address', description: 'Where do you live?' },
    { id: 'employment', title: 'Employment', description: 'Your work information' },
    { id: 'documents', title: 'Verification', description: 'Upload your documents' },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
  ];

  // Form validation rules
  const validationRules = {
    dateOfBirth: [
      (value) => !value ? 'Date of birth is required' : '',
      (value) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age < 18 ? 'You must be at least 18 years old' : '';
      },
    ],
    address: [
      (value) => !value ? 'Address is required' : '',
      (value) => value.length < 10 ? 'Please provide a complete address' : '',
    ],
    city: [
      (value) => !value ? 'City is required' : '',
    ],
    postalCode: [
      (value) => !value ? 'Postal code is required' : '',
    ],
    country: [
      (value) => !value ? 'Country is required' : '',
    ],
    employmentStatus: [
      (value) => !value ? 'Employment status is required' : '',
    ],
    occupation: [
      (value) => !value ? 'Occupation is required' : '',
    ],
    annualIncome: [
      (value) => !value ? 'Annual income is required' : '',
    ],
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(
    {
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      employmentStatus: '',
      employer: '',
      occupation: '',
      annualIncome: '',
      sourceOfFunds: '',
    },
    validationRules
  );

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      await completeOnboarding();
      return;
    }

    // Validate current step
    const stepFields = getStepFields(currentStep);
    const isStepValid = stepFields.every(field => {
      const error = validationRules[field]?.[0]?.(values[field]);
      return !error;
    });

    if (!isStepValid && currentStep > 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields correctly.',
      });
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const getStepFields = (step) => {
    switch (step) {
      case 1: return ['dateOfBirth'];
      case 2: return ['address', 'city', 'postalCode', 'country'];
      case 3: return ['employmentStatus', 'occupation', 'annualIncome'];
      case 4: return [];
      default: return [];
    }
  };

  const handleFileUpload = (documentType, file) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: file,
    }));

    addNotification({
      type: 'success',
      title: 'Document Uploaded',
      message: `${documentType} has been uploaded successfully.`,
    });
  };

  const completeOnboarding = async () => {
    try {
      setIsLoading(true);

      // Update user profile
      await kycAPI.updateUser(user.id, {
        date_of_birth: values.dateOfBirth,
        address: `${values.address}, ${values.city}, ${values.state} ${values.postalCode}, ${values.country}`,
        employment_status: values.employmentStatus,
        employer: values.employer,
        occupation: values.occupation,
        annual_income: values.annualIncome,
        source_of_funds: values.sourceOfFunds,
      });

      // Start KYC verification
      await kycAPI.startVerification(user.id, 'enhanced');

      addNotification({
        type: 'success',
        title: 'Profile Complete!',
        message: 'Your account setup is complete. Welcome to Flowlet!',
      });

      navigate('/dashboard');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Setup Failed',
        message: error.message || 'Failed to complete setup. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep 
            user={user} 
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <PersonalInfoStep
            values={values}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
          />
        );
      case 2:
        return (
          <AddressStep
            values={values}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
          />
        );
      case 3:
        return (
          <EmploymentStep
            values={values}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
          />
        );
      case 4:
        return (
          <DocumentsStep
            uploadedDocuments={uploadedDocuments}
            onFileUpload={handleFileUpload}
          />
        );
      case 5:
        return (
          <CompleteStep
            onComplete={completeOnboarding}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Account Setup</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <Progress value={progress} className="h-2 mb-4" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{steps[currentStep].title}</span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="card-mobile shadow-xl border-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Navigation */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="btn-mobile"
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              className="btn-mobile gradient-primary text-white"
              disabled={isLoading}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep = ({ user, onNext }) => (
  <CardContent className="text-center py-12">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
    >
      <User className="w-12 h-12 text-white" />
    </motion.div>
    
    <h2 className="text-3xl font-bold text-foreground mb-4">
      Welcome, {user?.first_name}!
    </h2>
    
    <p className="text-muted-foreground mb-8 text-lg">
      Let's complete your profile to unlock all Flowlet features. This will only take a few minutes.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="text-center p-4">
        <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Secure</h3>
        <p className="text-sm text-muted-foreground">Bank-level security</p>
      </div>
      <div className="text-center p-4">
        <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Compliant</h3>
        <p className="text-sm text-muted-foreground">Regulatory approved</p>
      </div>
      <div className="text-center p-4">
        <Check className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Simple</h3>
        <p className="text-sm text-muted-foreground">Quick setup</p>
      </div>
    </div>
    
    <Button
      onClick={onNext}
      className="btn-mobile gradient-primary text-white px-8"
    >
      Get Started
      <ArrowRight className="w-5 h-5 ml-2" />
    </Button>
  </CardContent>
);

// Personal Info Step Component
const PersonalInfoStep = ({ values, errors, touched, handleChange, handleBlur }) => (
  <CardContent className="py-8">
    <CardHeader className="px-0 pb-6">
      <CardTitle className="flex items-center">
        <User className="w-6 h-6 mr-2 text-primary" />
        Personal Information
      </CardTitle>
      <CardDescription>
        Please provide your personal details for verification
      </CardDescription>
    </CardHeader>
    
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
          Date of Birth
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            onBlur={() => handleBlur('dateOfBirth')}
            className={`input-mobile pl-10 ${errors.dateOfBirth && touched.dateOfBirth ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.dateOfBirth && touched.dateOfBirth && (
          <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
        )}
      </div>
    </div>
  </CardContent>
);

// Address Step Component
const AddressStep = ({ values, errors, touched, handleChange, handleBlur }) => (
  <CardContent className="py-8">
    <CardHeader className="px-0 pb-6">
      <CardTitle className="flex items-center">
        <MapPin className="w-6 h-6 mr-2 text-primary" />
        Address Information
      </CardTitle>
      <CardDescription>
        We need your address for verification and compliance
      </CardDescription>
    </CardHeader>
    
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium text-foreground">
          Street Address
        </label>
        <Textarea
          id="address"
          placeholder="123 Main Street, Apt 4B"
          value={values.address}
          onChange={(e) => handleChange('address', e.target.value)}
          onBlur={() => handleBlur('address')}
          className={`input-mobile ${errors.address && touched.address ? 'border-destructive' : ''}`}
          rows={3}
        />
        {errors.address && touched.address && (
          <p className="text-sm text-destructive">{errors.address}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-foreground">
            City
          </label>
          <Input
            id="city"
            placeholder="New York"
            value={values.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            className={`input-mobile ${errors.city && touched.city ? 'border-destructive' : ''}`}
          />
          {errors.city && touched.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium text-foreground">
            State/Province
          </label>
          <Input
            id="state"
            placeholder="NY"
            value={values.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="input-mobile"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="postalCode" className="text-sm font-medium text-foreground">
            Postal Code
          </label>
          <Input
            id="postalCode"
            placeholder="10001"
            value={values.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            className={`input-mobile ${errors.postalCode && touched.postalCode ? 'border-destructive' : ''}`}
          />
          {errors.postalCode && touched.postalCode && (
            <p className="text-sm text-destructive">{errors.postalCode}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium text-foreground">
            Country
          </label>
          <Select value={values.country} onValueChange={(value) => handleChange('country', value)}>
            <SelectTrigger className={`input-mobile ${errors.country && touched.country ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
            </SelectContent>
          </Select>
          {errors.country && touched.country && (
            <p className="text-sm text-destructive">{errors.country}</p>
          )}
        </div>
      </div>
    </div>
  </CardContent>
);

// Employment Step Component
const EmploymentStep = ({ values, errors, touched, handleChange, handleBlur }) => (
  <CardContent className="py-8">
    <CardHeader className="px-0 pb-6">
      <CardTitle className="flex items-center">
        <Briefcase className="w-6 h-6 mr-2 text-primary" />
        Employment Information
      </CardTitle>
      <CardDescription>
        This helps us understand your financial profile
      </CardDescription>
    </CardHeader>
    
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="employmentStatus" className="text-sm font-medium text-foreground">
          Employment Status
        </label>
        <Select value={values.employmentStatus} onValueChange={(value) => handleChange('employmentStatus', value)}>
          <SelectTrigger className={`input-mobile ${errors.employmentStatus && touched.employmentStatus ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Select employment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employed">Employed</SelectItem>
            <SelectItem value="self-employed">Self-Employed</SelectItem>
            <SelectItem value="unemployed">Unemployed</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        {errors.employmentStatus && touched.employmentStatus && (
          <p className="text-sm text-destructive">{errors.employmentStatus}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="employer" className="text-sm font-medium text-foreground">
          Employer (Optional)
        </label>
        <Input
          id="employer"
          placeholder="Company name"
          value={values.employer}
          onChange={(e) => handleChange('employer', e.target.value)}
          className="input-mobile"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="occupation" className="text-sm font-medium text-foreground">
          Occupation
        </label>
        <Input
          id="occupation"
          placeholder="Software Engineer"
          value={values.occupation}
          onChange={(e) => handleChange('occupation', e.target.value)}
          onBlur={() => handleBlur('occupation')}
          className={`input-mobile ${errors.occupation && touched.occupation ? 'border-destructive' : ''}`}
        />
        {errors.occupation && touched.occupation && (
          <p className="text-sm text-destructive">{errors.occupation}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="annualIncome" className="text-sm font-medium text-foreground">
          Annual Income
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Select value={values.annualIncome} onValueChange={(value) => handleChange('annualIncome', value)}>
            <SelectTrigger className={`input-mobile pl-10 ${errors.annualIncome && touched.annualIncome ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select income range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-25k">Under $25,000</SelectItem>
              <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
              <SelectItem value="100k-200k">$100,000 - $200,000</SelectItem>
              <SelectItem value="over-200k">Over $200,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {errors.annualIncome && touched.annualIncome && (
          <p className="text-sm text-destructive">{errors.annualIncome}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="sourceOfFunds" className="text-sm font-medium text-foreground">
          Source of Funds (Optional)
        </label>
        <Textarea
          id="sourceOfFunds"
          placeholder="Describe the source of funds you'll be using..."
          value={values.sourceOfFunds}
          onChange={(e) => handleChange('sourceOfFunds', e.target.value)}
          className="input-mobile"
          rows={3}
        />
      </div>
    </div>
  </CardContent>
);

// Documents Step Component
const DocumentsStep = ({ uploadedDocuments, onFileUpload }) => (
  <CardContent className="py-8">
    <CardHeader className="px-0 pb-6">
      <CardTitle className="flex items-center">
        <FileText className="w-6 h-6 mr-2 text-primary" />
        Document Verification
      </CardTitle>
      <CardDescription>
        Upload your identity documents for verification
      </CardDescription>
    </CardHeader>
    
    <div className="space-y-6">
      <DocumentUpload
        title="Government ID"
        description="Passport, Driver's License, or National ID"
        documentType="government_id"
        uploadedFile={uploadedDocuments.government_id}
        onFileUpload={onFileUpload}
      />
      
      <DocumentUpload
        title="Proof of Address"
        description="Utility bill, Bank statement, or Lease agreement"
        documentType="proof_of_address"
        uploadedFile={uploadedDocuments.proof_of_address}
        onFileUpload={onFileUpload}
      />
    </div>
  </CardContent>
);

// Document Upload Component
const DocumentUpload = ({ title, description, documentType, uploadedFile, onFileUpload }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(documentType, file);
    }
  };

  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
      <div className="mb-4">
        {uploadedFile ? (
          <Check className="w-12 h-12 text-green-500 mx-auto" />
        ) : (
          <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
        )}
      </div>
      
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      {uploadedFile ? (
        <div className="text-sm text-green-600 mb-4">
          ✓ {uploadedFile.name} uploaded
        </div>
      ) : null}
      
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
        id={`upload-${documentType}`}
      />
      
      <label
        htmlFor={`upload-${documentType}`}
        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
      >
        <Camera className="w-4 h-4 mr-2" />
        {uploadedFile ? 'Replace File' : 'Upload File'}
      </label>
    </div>
  );
};

// Complete Step Component
const CompleteStep = ({ onComplete, isLoading }) => (
  <CardContent className="text-center py-12">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
    >
      <Check className="w-12 h-12 text-white" />
    </motion.div>
    
    <h2 className="text-3xl font-bold text-foreground mb-4">
      You're All Set!
    </h2>
    
    <p className="text-muted-foreground mb-8 text-lg">
      Your profile is complete. We'll review your documents and notify you once your account is fully verified.
    </p>
    
    <div className="bg-muted rounded-lg p-6 mb-8">
      <h3 className="font-semibold mb-4">What's Next?</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Document verification (1-2 business days)</p>
        <p>• Account activation notification</p>
        <p>• Full access to all Flowlet features</p>
      </div>
    </div>
    
    <Button
      onClick={onComplete}
      className="btn-mobile gradient-primary text-white px-8"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Completing Setup...
        </div>
      ) : (
        <>
          Continue to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </>
      )}
    </Button>
  </CardContent>
);

export default OnboardingFlow;


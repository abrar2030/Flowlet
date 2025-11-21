import React, { useState, useCallback, useEffect } from "react";
import { EncryptionService } from "../../lib/security/encryption";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  Unlock,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Key,
} from "lucide-react";

interface EncryptedData {
  encrypted: string;
  iv: string;
  key: string;
  tag: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface EncryptedDisplayProps {
  data: EncryptedData | string;
  label?: string;
  type?: "text" | "email" | "phone" | "ssn" | "card" | "custom";
  maskPattern?: string;
  allowDecryption?: boolean;
  autoHideDelay?: number;
  showMetadata?: boolean;
  onDecrypt?: (decryptedData: string) => void;
  onCopy?: (data: string) => void;
  className?: string;
}

interface DisplayState {
  isDecrypted: boolean;
  decryptedData: string | null;
  isDecrypting: boolean;
  error: string | null;
  showCopied: boolean;
  autoHideTimer: NodeJS.Timeout | null;
}

export function EncryptedDisplay({
  data,
  label,
  type = "text",
  maskPattern,
  allowDecryption = true,
  autoHideDelay = 30000, // 30 seconds
  showMetadata = false,
  onDecrypt,
  onCopy,
  className = "",
}: EncryptedDisplayProps) {
  const [state, setState] = useState<DisplayState>({
    isDecrypted: false,
    decryptedData: null,
    isDecrypting: false,
    error: null,
    showCopied: false,
    autoHideTimer: null,
  });

  // Parse encrypted data
  const encryptedData: EncryptedData =
    typeof data === "string" ? JSON.parse(data) : data;

  // Clear auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
      }
    };
  }, [state.autoHideTimer]);

  const handleDecrypt = useCallback(async () => {
    if (!allowDecryption) return;

    setState((prev) => ({ ...prev, isDecrypting: true, error: null }));

    try {
      const decrypted = EncryptionService.decrypt(encryptedData);

      setState((prev) => ({
        ...prev,
        isDecrypted: true,
        decryptedData: decrypted,
        isDecrypting: false,
      }));

      // Set auto-hide timer
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isDecrypted: false,
            decryptedData: null,
            autoHideTimer: null,
          }));
        }, autoHideDelay);

        setState((prev) => ({ ...prev, autoHideTimer: timer }));
      }

      if (onDecrypt) {
        onDecrypt(decrypted);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to decrypt data",
        isDecrypting: false,
      }));
    }
  }, [encryptedData, allowDecryption, autoHideDelay, onDecrypt]);

  const handleHide = useCallback(() => {
    if (state.autoHideTimer) {
      clearTimeout(state.autoHideTimer);
    }

    setState((prev) => ({
      ...prev,
      isDecrypted: false,
      decryptedData: null,
      autoHideTimer: null,
    }));
  }, [state.autoHideTimer]);

  const handleCopy = useCallback(
    async (dataToCopy: string) => {
      try {
        await navigator.clipboard.writeText(dataToCopy);
        setState((prev) => ({ ...prev, showCopied: true }));

        setTimeout(() => {
          setState((prev) => ({ ...prev, showCopied: false }));
        }, 2000);

        if (onCopy) {
          onCopy(dataToCopy);
        }
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [onCopy],
  );

  const getMaskedDisplay = useCallback(
    (decryptedData: string): string => {
      if (!decryptedData) return "";

      switch (type) {
        case "email":
          const [localPart, domain] = decryptedData.split("@");
          if (localPart && domain) {
            const maskedLocal =
              localPart.length > 2
                ? localPart[0] +
                  "*".repeat(localPart.length - 2) +
                  localPart.slice(-1)
                : "*".repeat(localPart.length);
            return `${maskedLocal}@${domain}`;
          }
          return decryptedData;

        case "phone":
          const digits = decryptedData.replace(/\D/g, "");
          if (digits.length === 10) {
            return `(***) ***-${digits.slice(-4)}`;
          }
          return `***-***-${digits.slice(-4)}`;

        case "ssn":
          const ssnDigits = decryptedData.replace(/\D/g, "");
          return `***-**-${ssnDigits.slice(-4)}`;

        case "card":
          const cardDigits = decryptedData.replace(/\D/g, "");
          return `**** **** **** ${cardDigits.slice(-4)}`;

        case "custom":
          if (maskPattern) {
            return maskPattern.replace(/\*/g, () => "*");
          }
          return (
            "*".repeat(Math.max(4, decryptedData.length - 4)) +
            decryptedData.slice(-4)
          );

        default:
          return decryptedData.length > 8
            ? "*".repeat(decryptedData.length - 4) + decryptedData.slice(-4)
            : "*".repeat(decryptedData.length);
      }
    },
    [type, maskPattern],
  );

  const getTypeIcon = () => {
    switch (type) {
      case "email":
        return "📧";
      case "phone":
        return "📱";
      case "ssn":
        return "🆔";
      case "card":
        return "💳";
      default:
        return "🔒";
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-blue-600" />
            {label || "Encrypted Data"}
            <span className="ml-2">{getTypeIcon()}</span>
          </span>
          <Badge variant="secondary" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Encrypted
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {/* Encrypted/Decrypted Data Display */}
          <div className="p-3 bg-gray-50 rounded-md border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">
                {state.isDecrypted ? "Decrypted Data" : "Encrypted Data"}
              </span>
              {state.isDecrypted && (
                <Badge variant="outline" className="text-xs">
                  <Unlock className="w-3 h-3 mr-1" />
                  Visible
                </Badge>
              )}
            </div>

            <div className="font-mono text-sm break-all">
              {state.isDecrypted && state.decryptedData ? (
                <div className="space-y-2">
                  <div className="text-green-700 bg-green-50 p-2 rounded border">
                    {state.decryptedData}
                  </div>
                  <div className="text-xs text-gray-500">
                    Masked: {getMaskedDisplay(state.decryptedData)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  {encryptedData.encrypted.substring(0, 32)}...
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {allowDecryption && (
              <Button
                onClick={state.isDecrypted ? handleHide : handleDecrypt}
                disabled={state.isDecrypting}
                size="sm"
                variant={state.isDecrypted ? "outline" : "default"}
                className="flex-1"
              >
                {state.isDecrypting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                    Decrypting...
                  </>
                ) : state.isDecrypted ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-2" />
                    Decrypt
                  </>
                )}
              </Button>
            )}

            {state.isDecrypted && state.decryptedData && (
              <Button
                onClick={() => handleCopy(state.decryptedData!)}
                size="sm"
                variant="outline"
              >
                {state.showCopied ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Auto-hide countdown */}
          {state.isDecrypted && autoHideDelay > 0 && (
            <div className="text-xs text-amber-600 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Data will be hidden automatically in{" "}
              {Math.ceil(autoHideDelay / 1000)} seconds
            </div>
          )}

          {/* Metadata */}
          {showMetadata && (
            <div className="space-y-2 text-xs text-gray-500">
              <div className="border-t pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Algorithm:</span> AES-256-GCM
                  </div>
                  <div>
                    <span className="font-medium">Key Size:</span> 256 bits
                  </div>
                  {encryptedData.timestamp && (
                    <div className="col-span-2">
                      <span className="font-medium">Encrypted:</span>{" "}
                      {formatTimestamp(encryptedData.timestamp)}
                    </div>
                  )}
                </div>
              </div>

              {encryptedData.metadata && (
                <div className="border-t pt-2">
                  <span className="font-medium">Metadata:</span>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(encryptedData.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
          <div className="flex items-center">
            <Key className="w-3 h-3 mr-1 text-blue-600" />
            <span className="font-medium text-blue-800">Security Notice:</span>
          </div>
          <p className="mt-1 text-blue-700">
            This data is encrypted using AES-256-GCM. Decryption occurs
            client-side only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EncryptedDisplay;

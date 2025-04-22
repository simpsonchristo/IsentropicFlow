'''
@venv: <venv>
@author: <Name>
@version: 1.0.0
@title: Isentropic Flow Module
'''

import numpy as np
import matplotlib.pyplot as plt


#def isentropicFlow(val, type, gamma):
class IsentropicFlow:
    #ToDo add conical shock relations
    def __init__(self, gamma=1.4, solverType='ifr'):
        if not isinstance(gamma, (int, float)):
            raise TypeError('Inappropriate type {} for gamma: a float or int is expected'.format(type(gamma)))
        self.gamma = float(gamma)
        if gamma <=1.0:
            raise ValueError('gamma must be greater than 1.0')
        self.solverType = solverType

    #ToDo delete if statements and replace with a function for each solver...
    #could also replace as a subclass inheriting the overall isentropic flow class
    def ifr(self, val, selectedItem):
        #ToDo put in the selected item and calculate the mach number
        pass

    def rayf(self, val, selectedItem):
        t02t01 = 1 + val.q/(val.cp*val.t01)



    # Temperature Ratio: T/To = Temperature / Total Temperature
    def tt0(self,m):
        return np.pow((1.+(self.gamma-1)/2.*m*m),-1)

    # Pressure Ratio: P/Po = Pressure / Total Pressure
    def pp0(self,m):
        return np.pow((1.+(self.gamma-1.)/2.*m*m),-self.gamma/(self.gamma-1.))

    # Density Ratio: rho/rho_o
    def rr0(self,m):
        return np.pow((1.+(self.gamma-1.)/2*m*m),-1/(self.gamma-1.))

    # Temp over Temp star: T/T* = Temperature / Temperature(Mach=1)
    def tts(self,m):
        return self.tt0(self,m)*(self.gamma/2. + 0.5)

    # Pressure over Pressure star: P/P*
    def pps(self,m):
        return self.pp0(self,m)*np.pow((self.gamma/2 +0.5),self.gamma/(self.gamma-1.))

    # Density over Density star
    def rrs(self,m):
        return self.rr0(self,m)*np.pow((self.gamma/2 +0.5),1./(self.gamma-1.))

    # Area Ratio for choked flow
    def aas(self,m):
        return 1./self.rrs(self,m)*np.sqrt(1./self.tts(self,m))/m

    #total temperature max w/ heat flux
    def t0t0sr(self,m):
        return 2*(1+self.gamma)*np.pow(m,2)/np.pow(1+self.gamma*np.pow(m,2),2)*(1+((self.gamma - 1)/2)*np.pow(m,2))
    #static temperature max w/ heat flux
    def ttsr(self, m):
        return np.pow(m,2)*np.pow(1+self.gamma,2)/np.pow((1+self.gamma*np.pow(m,2)),2)
    #static pressure max with heat flux
    def ppsr(self, m):
        return (1+self.gamma)/(1+self.gamma*np.pow(m,2))
    #total pressure max w/ heat flux
    def p0p0sr(self, m):
        return (1+self.gamma)/(1+self.gamma*np.pow(m,2))*np.pow((1+(self.gamma-1)/2*np.pow(m,2))/((self.gamma+1)/2),self.gamma/(self.gamma-1))
    #specific volume (1/rho) max
    def vvsr(self, m):
        return (1+self.gamma)/(1+(self.gamma*np.pow(m,2)))*np.pow(m,2)
    #change in enthalpy (max heat)
    def sscpsr(self, m):
        return np.log(np.pow(m,2)*np.pow((1+self.gamma)/(1+(self.gamma*np.pow(m,2))),(self.gamma+1)/self.gamma))


    # Prandtl Meyer Function
    def nu(self,m):
        n = np.sqrt((self.gamma + 1.) / (self.gamma - 1.)) * np.atan(np.sqrt((self.gamma - 1.) / (self.gamma + 1.) * (m * m - 1.)))
        n = n - np.atan(np.sqrt(m * m - 1.))
        n = n * 180. / 3.14159265359
        return n

    def m2(self,m1):
        return np.sqrt((1. + .5 * (self.gamma - 1.) * m1 * m1) / (self.gamma * m1 * m1 - .5 * (self.gamma - 1.)))

    def __call__(self):
        pass
        # if (self.solverType=='ifr'):
        #     #input values, mach no, T/T0, p/p0, rho/rho0, A/A*(sub), A/A*(super), Mach angle, P-M angle
        #     def ifr(val, item):
        #         if item
        #
        # elif self.solverType=='osr':
        #     #input values, M1 + {turn angle (weak), turn angle (strong), wave angle, M1n}
        #
        # elif self.solverType=='nsr':
        #     #input values, M1, M2, p2/p1, rho2/rho1, T2/T1, p02/p01, p1/p02
        #
        # elif self.solverType=='fanf':
        #     #input values, mach no, T/T*, P/P*, P0/P0* (sub or sup), U/U*, 4fL*/D (sup or sub), (s*-s)/R (sup or sub)
        #
        # elif self.solverType=='rayf':
        #     #input values, mach no, T0/T0* (sup or sup), T/T*(above or below Tmax), P/P*, P0/P0*(sup or sub), U/U*, (s*-s)/R (sup or sub)


if __name__ == "__main__":

    def unittestrange(text, value, truthlow, truthhigh):
        if truthlow <= value <= truthhigh:
            print(f' {text} Passed')
        else:
            print(f' {text} Failed     Value {value}   Truth {truthlow} to {truthhigh}')
    def unittestvec(text,value,truth, tolerance):
        truthlow = [i*(1-tolerance) for i in truth]
        truthhigh = [i * (1 + tolerance) for i in truth]
        valuevec = [i  for i in value]
        unittestrange(text,valuevec,truthlow,truthhigh)
    def unittestscalar(text,value,truth, tolerance):
        truthlow = truth * (1 - tolerance)
        truthhigh =  truth * (1 + tolerance)
        unittestrange(text, value, truthlow, truthhigh)

    print(f'Unit tests of Isentropic Flow')
    flow = IsentropicFlow()
    # Reference Isentropic Flow Values from Gas Dynamics, James John, Table A.1
    unittestscalar("T/To Mach 1",flow.tt0(1),0.83333, 0.01)
    unittestscalar("T/To Mach 2", flow.tt0(2), 0.5555, 0.01)
    unittestscalar("P/Po Mach 1", flow.pp0(1), 0.5283, 0.01)
    unittestscalar("P/Po Mach 2", flow.pp0(2), 0.1278, 0.01)

    # Reference P-M Values from Gas Dynamics, James John, Appendix D
    unittestscalar("nu Mach 1", flow.nu(1), 0, 0.01)
    unittestscalar("nu Mach 2", flow.nu(2), 26.380, 0.01)
    
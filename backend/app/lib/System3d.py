import math
import numpy as np

try:
    from .Crossection import Crossection
    from .Crossection import Material
except ImportError:
    from Crossection import Crossection
    from Crossection import Material

class BeamKnot:
    '''
    Класс, описывающий узел стержня
        Параметры, передаваемые в конструктор класса:
            id - идентификатор узла стержня
            point - точка расположения узла стержня в глобальной системе координат (словарь с ключами x, y, z: float)
            forces - усилия и моменты в узле стержня (словарь с ключами Fx, Fy, Fz, Mx, My, Mz: float)
            base - базисные условия узла стержня, показывающие возможность перемещения (словарь с ключами u, v, w, fix, fiy, fiz: bool)
        Методы класса:
            getForces() - получение усилий и моментов в узле стержня
            setForces(**kwargs) - установка усилий и моментов в узле стержня
            getBase() - получение базисных условий узла стержня
            setBase(**kwargs) - установка базисных условий узла стержня
            setForcesToDef() - установка усилий и моментов в узле стержня в дефолтное состояние (0, 0, 0, 0, 0, 0)
            setBaseToDef() - установка базисных условий узла стержня в дефолтное состояние (False, False, False, False, False, False)
            getPoint() - получение точки расположения узла стержня
            distanceTo(other: BeamKnot) - получение расстояния от узла стержня до другого узла
    '''

    def __init__(self, id, point: dict = None, forces: dict = None, base: dict = None):
        self.id = id
        self.setPointToDef()
        if point is not None:
            self.setPoint(**point)
        self.setForcesToDef()
        if forces is not None:
            self.setForces(**forces)
        self.setBaseToDef()
        if base is not None:
            self.setBase(**base)
    
    def setForcesToDef(self):
        '''
        Установка усилий и моментов в узле стержня в дефолтное состояние (0, 0, 0, 0, 0, 0)
        '''
        self.forces = {'Fx': 0.0, 'Fy': 0.0, 'Fz': 0.0,
                       'Mx': 0.0, 'My': 0.0, 'Mz': 0.0}
        return self

    def setForces(self, **kwargs):
        '''
        Установка усилий и моментов в узле стержня
        Параметры:
            Fx, Fy, Fz, Mx, My, Mz - усилия и моменты в узле стержня
        '''
        self.forces['Fx'] = kwargs.get('Fx', self.forces['Fx'])
        self.forces['Fy'] = kwargs.get('Fy', self.forces['Fy'])
        self.forces['Fz'] = kwargs.get('Fz', self.forces['Fz'])
        self.forces['Mx'] = kwargs.get('Mx', self.forces['Mx'])
        self.forces['My'] = kwargs.get('My', self.forces['My'])
        self.forces['Mz'] = kwargs.get('Mz', self.forces['Mz'])
        return self

    def setBaseToDef(self):
        '''
        Установка базисных условий узла стержня в дефолтное состояние (False, False, False, False, False, False)
        '''
        self.base = {'u': False, 'v': False, 'w': False,
                     'fix': False, 'fiy': False, 'fiz': False}
        return self

    def setBase(self, **kwargs):
        '''
        Установка базисных условий узла стержня
        Параметры:
            u, v, w, fix, fiy, fiz - базисные условия узла стержня
        '''
        self.base['u'] = kwargs.get('u', self.base['u'])
        self.base['v'] = kwargs.get('v', self.base['v'])
        self.base['w'] = kwargs.get('w', self.base['w'])
        self.base['fix'] = kwargs.get('fix', self.base['fix'])
        self.base['fiy'] = kwargs.get('fiy', self.base['fiy'])
        self.base['fiz'] = kwargs.get('fiz', self.base['fiz'])
        return self
    
    def setPointToDef(self):
        '''
        Установка координат узла стержня в дефолтное состояние (0.0, 0.0, 0.0)
        '''
        self.point = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        return self

    def setPoint(self, **kwargs):
        '''
        Установка координат узла стержня
        Параметры:
            x, y, z - координаты узла стержня
        '''
        self.point['x'] = kwargs.get('x', self.point['x'])
        self.point['y'] = kwargs.get('y', self.point['y'])
        self.point['z'] = kwargs.get('z', self.point['z'])
        return self

    def getPoint(self):
        '''
        Получение координат узла стержня
        Возвращаемое значение:
            (x, y, z) - кортеж координат узла стержня
        '''
        return (self.point['x'], self.point['y'], self.point['z'])

    def distanceTo(self, other):
        '''
        Получение расстояния от узла стержня до другого узла
        Параметры:
            other - другой узел стержня
        Возвращаемое значение:
            расстояние от узла стержня до другого узла
        '''
        if isinstance(other, BeamKnot):
            return math.sqrt(sum(map(lambda x: math.pow(x, 2), other - self)))
        else:
            raise TypeError("unsupported operand type")

    def getBaseIndexes(self):
        '''
        Получение индексов базисных условий узла стержня
            Возвращаемое значение: список индексов базисных условий узла стержня
        '''
        indexLst = []
        if  self.base['u']:   indexLst.append(0)
        if  self.base['v']:   indexLst.append(1)
        if  self.base['w']:   indexLst.append(2)
        if  self.base['fix']: indexLst.append(3)
        if  self.base['fiy']: indexLst.append(4)
        if  self.base['fiz']: indexLst.append(5)
        return indexLst
    
    def getForces(self, forceFactor: float = 1.0, momentFactor: float = 1.0):
        '''
        Получение усилий и моментов в узле стержня
            Возвращаемое значение: массив усилий и моментов в узле стержня
        '''
        return np.array([self.forces['Fx'] * forceFactor, self.forces['Fy'] * forceFactor, self.forces['Fz'] * forceFactor, 
                         self.forces['Mx'] * momentFactor, self.forces['My'] * momentFactor, self.forces['Mz'] * momentFactor])

    def __sub__(self, other):
        if isinstance(other, BeamKnot):
            return (self.point['x'] - other.point['x'], self.point['y'] - other.point['y'], self.point['z'] - other.point['z'])
        else:
            raise TypeError("unsupported operand type")

    def __str__(self):
        return f'BeamKnot: {self.id}'

    def __repr__(self):
        return f'<BeamKnot: {self.id}>'


class Beam:
    '''
    Класс стержня
        Параметры, передаваемые в конструктор класса:
            id - идентификатор стержня
            material - материал стержня (объект)
            crossection - поперечное сечение стержня (объект)
            startKnot - идентификатор начальной точки стержня
            endKnot - идентификатор конечной точки стержня
            cacheProps - флаг кеширования свойств стержня (True по умолчанию)
        Свойства:
            id - идентификатор стержня
            material - материал стержня (объект)
            crossection - поперечное сечение стержня (объект)
            knots - идентификаторы узлов стержня (кортеж)
            points - координаты точек стержня (кортеж)
            alpha - угол поворота стержня вокруг своей оси, радиан (0.0 по умолчанию)
            length - длина стержня, мм (кешируется)
            mass - масса стержня, кг (кешируется)
            rotateMatrix - матрица поворота стержня (кешируется)
        Методы:
            getLength() - функция расчета длины стержня, мм
            getMass() - функция расчета массы стержня, кг
            getRotateMatrix() - функция получения матрицы поворота стержня по заданным координатам и углу поворота
            clearCache() - функция очистки кеша
    '''

    def __init__(self, id, material: Material, crossection: Crossection, alpha: float, startKnot: BeamKnot, endKnot: BeamKnot, cacheProps: bool = True):
        self._cache = {}
        self.cacheProps = cacheProps
        self.id = id
        self.material = material
        self.crossection = crossection
        self.alpha = alpha
        self.startKnot = startKnot
        self.endKnot = endKnot

    @property
    def knots(self):
        '''
        Свойство - кортеж идентификаторов узлов стержня
        '''
        return (self.startKnot.id, self.endKnot.id)

    @property
    def points(self):
        '''
        Свойство - кортеж координат точек стержня
        '''
        return (self.startKnot.point, self.endKnot.point)

    @property
    def length(self):
        '''
        Свойство - длина стержня, мм (результат кешируется)
        '''
        length = self._cache.get('length', None)
        if length is None:
            length = self.getLength()
            if self.cacheProps:
                self._cache['length'] = length
        return length

    @property
    def mass(self):
        '''
        Свойство - масса стержня, кг (результат кешируется)
        '''
        mass = self._cache.get('mass', None)
        if mass is None:
            mass = self.getMass()
            if self.cacheProps:
                self._cache['mass'] = mass
        return mass

    @property
    def rotateMatrix(self):
        '''
        Свойство - матрица поворота стержня (результат кешируется)
        '''
        RM = self._cache.get('RM', None)
        if RM is None:
            RM = self.getRotateMatrix()
            if self.cacheProps:
                self._cache['RM'] = RM
        return RM

    @property
    def stiffnessMatrix(self):
        '''
        Матрица жесткости стержня в локальной системе координат (результат кешируется)
        '''
        SM = self._cache.get('SM', None)
        if SM is None:
            SM = self.getStiffnessMatrix()
            if self.cacheProps:
                self._cache['SM'] = SM
        return SM
        
    @property
    def stiffnessMatrixGCS(self):
        '''
        Матрица жесткости стержня в глобальной системе координат (результат кешируется)
        '''
        SM = self.stiffnessMatrix
        V = np.zeros((12, 12))
        V[0:3, 0:3] = self.rotateMatrix
        V[3:6, 3:6] = self.rotateMatrix
        V[6:9, 6:9] = self.rotateMatrix
        V[9:12, 9:12] = self.rotateMatrix
        return (V.T.dot(SM)).dot(V)


    def getLength(self):
        '''
        Функция расчета длины стержня, мм
        '''
        return self.startKnot.distanceTo(self.endKnot)

    def getMass(self):
        '''
        Функция расчета массы стержня, кг
        '''
        return self.material.rho * (self.crossection.getArea() / 1e6) * (self.length / 1e3)

    def getRotateMatrix(self):
        ''' 
        Функция получения матрицы поворота стержня по заданным координатам вектора и углу поворота оси
        '''
        # Вспомогательные функции для определения косинуса угла между векторами
        def dotproduct(v1, v2): return sum((a*b) for a, b in zip(v1, v2))
        def length(v): return math.sqrt(dotproduct(v, v))
        def cosAngle(v1, v2): return dotproduct(
            v1, v2) / (length(v1) * length(v2))

        def sinFromCos(cos): return math.sqrt(1 - cos ** 2)

        # Основные данные для расчета
        dx, dy, dz = tuple(map(abs, self.endKnot - self.startKnot))
        l = self.length

        # 1. Определяем косинус угла между осью стержня (х0 ЛСК) и осью z, через него находим синус угла, который числено
        # равен координате z в ГСК единичного вектора  r направленного вдоль оси z0 (ЛСК) при отсутствии вращения на угол a
        # вдоль оси x0 (ЛСК)
        cos_x0z = abs(cosAngle([dx, dy, dz], [0, 0, 1]))
        sin_x0z = sinFromCos(cos_x0z)

        # 2. Определяем косинус и синус угла поворота проекции стержня на плоскость {XY} (ГСК) к оси x (ГСК)
        cos_t = 0
        if dx != 0 and dy != 0:
            cos_t = abs(cosAngle([dx, dy, 0], [1, 0, 0]))
        elif dx == 0 and dy == 0:
            cos_t = 1
        elif dx != 0 and dy == 0:
            cos_t = 1
        sin_t = sinFromCos(cos_t)

        if dz > 0:
            if dx >= 0 and dy >= 0:
                cos_t = -cos_t
                sin_t = -sin_t
            elif dx < 0 and dy >= 0:
                sin_t = -sin_t
            elif dx < 0 and dy < 0:
                pass
            elif dx >= 0 and dy < 0:
                cos_t = -cos_t
        else:
            if dx >= 0 and dy >= 0:
                pass
            elif dx < 0 and dy >= 0:
                cos_t = -cos_t
            elif dx < 0 and dy < 0:
                cos_t = -cos_t
                sin_t = -sin_t
            elif dx >= 0 and dy < 0:
                sin_t = -sin_t

        # 3. Матрица поворота стержня без учета вращения вокруг собственной оси x0 (ЛСК)
        V = np.array([[dx / l, dy / l, dz / l], [0, 0, 0],
                     [cos_t * abs(cos_x0z), sin_t * abs(cos_x0z), sin_x0z]])
        V[1] = np.cross(V[2], V[0])

        # 5. Матрица поворота вокруг собственной оси на угол alpha
        V3 = np.array([[1, 0, 0],
                       [0, math.cos(self.alpha), - math.sin(self.alpha)],
                       [0, math.sin(self.alpha), math.cos(self.alpha)]]).T

        return V3.dot(V)

    def getStiffnessMatrix(self):
        ''' 
        Функция получения матрицы жесткости стержня
            Возвращает:
                Матрицу жесткости стержня в локальной системе координат
        '''
        # исходные величины стержня
        self._requireCrossectionAxisYZ()
        csParams = self.crossection.calculateParams()
        S = csParams['A']
        l = self.length
        E = self.material.E
        G = self.material.G
        # момент инерции стержня относительно оси x (момент сопротивления кручению), мм4
        Jx = csParams['Jp']
        Jy = csParams['Jy']  # момент инерции стержня относительно оси y, мм4
        Jz = csParams['Jz']  # момент инерции стержня относительно оси z, мм4

        # конструктор матрицы жесткости
        valR = np.zeros((12, 12))
        val = E * S / l
        valR[0, 0] = val
        valR[6, 0] = -val
        valR[6, 6] = val
        val = 12 * E * Jz / (l ** 3)
        valR[1, 1] = val
        valR[7, 1] = -val
        valR[7, 7] = val
        val = 12 * E * Jy / (l ** 3)
        valR[2, 2] = val
        valR[8, 2] = -val
        valR[8, 8] = val
        val = 6 * E * Jz / (l ** 2)
        valR[5, 1] = val
        valR[11, 1] = val
        valR[7, 5] = -val
        valR[11, 7] = -val
        val = 6 * E * Jy / (l ** 2)
        valR[4, 2] = -val
        valR[10, 2] = -val
        valR[10, 8] = val
        valR[8, 4] = val
        val = G * Jx / l
        valR[3, 3] = val
        valR[9, 3] = -val
        valR[9, 9] = val
        val = 4 * E * Jy / l
        valR[4, 4] = val
        valR[10, 10] = val
        val = 4 * E * Jz / l
        valR[5, 5] = val
        valR[11, 11] = val
        val = 2 * E * Jy / l
        valR[10, 4] = val
        val = 2 * E * Jz / l
        valR[11, 5] = val
        return np.where(valR, valR, valR.T)


    def _normalizeVector(self, vector, name='vector'):
        """
        Нормализация трехмерного вектора.
        """
        v = np.array(vector, dtype=float)

        if v.shape != (3,):
            raise ValueError(f'{name} должен быть трехмерным вектором [x, y, z]')

        norm = np.linalg.norm(v)
        if norm == 0:
            raise ValueError(f'{name} не должен быть нулевым вектором')

        return v / norm


    def _requireCrossectionAxisYZ(self):
        """
        Проверка, что сечение стержня задано в плоскости YZ.

        Для Beam локальная ось X является продольной осью стержня,
        поэтому поперечное сечение должно иметь axis='YZ'.
        """
        if self.crossection.axis != 'YZ':
            raise ValueError(
                "Для Beam поперечное сечение должно иметь axis='YZ', "
                "так как локальная ось X является продольной осью стержня"
            )


    def getWindDirectionLCS(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Перевод направления ветра из глобальной системы координат в локальную
        систему координат стержня.

        windDirection:
            Единичный или произвольный ненулевой вектор направления ветра в ГСК.

        Возвращает:
            Единичный вектор направления ветра в ЛСК стержня [x, y, z].
        """
        wind = self._normalizeVector(windDirection, name='windDirection')
        return self.rotateMatrix.dot(wind)


    def getWindDirectionCrossection(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Получение направления ветра в плоскости поперечного сечения Beam.

        Для Beam поддерживается только crossection.axis='YZ'.

        Возвращает:
            Двухмерный вектор [wind_y, wind_z] в локальной плоскости YZ.
        """
        self._requireCrossectionAxisYZ()

        wind_lcs = self.getWindDirectionLCS(windDirection)
        return np.array([wind_lcs[1], wind_lcs[2]], dtype=float)


    def getWindProjectionFactor(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет коэффициента проекции длины стержня на плоскость,
        перпендикулярную направлению ветра.

        Возвращает:
            sin(alpha), где alpha - угол между локальной осью X стержня
            и направлением ветра.
        """
        wind_cs = self.getWindDirectionCrossection(windDirection)
        return float(np.linalg.norm(wind_cs))


    def getEffectiveWindWidth(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет эффективной ширины поперечного сечения стержня, мм.
        """
        wind_cs = self.getWindDirectionCrossection(windDirection)

        if np.linalg.norm(wind_cs) == 0:
            return 0.0

        return self.crossection.getProjectionWidth(wind_cs)


    def getEffectiveWindArea(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет эффективной ветровой площади стержня, мм2.

        A_eff = L * sin(alpha) * b_eff

        где:
            L - длина стержня, мм;
            sin(alpha) - коэффициент проекции длины стержня;
            b_eff - эффективная ширина сечения, мм.
        """
        projection_factor = self.getWindProjectionFactor(windDirection)

        if projection_factor == 0:
            return 0.0

        width = self.getEffectiveWindWidth(windDirection)
        return float(self.length * projection_factor * width)







    def clearCache(self):
        '''
        Функция очистки кеша
        '''
        self._cache = {}
        return self

    def __str__(self):
        return f'Beam: {self.id}'

    def __repr__(self):
        return f'<Beam: {self.id}>'
    





